<?php

namespace App\Http\Requests\TransportOrders\Concerns;

use App\Enums\ContractStatus;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\TransportOrder;
use App\Support\Money;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Shared field rules and cross-field business validation for creating and
 * updating a transport order: customer/contract/route eligibility, trips,
 * price override authorization, and additional charges.
 */
trait ValidatesTransportOrder
{
    /**
     * @return array<string, mixed>
     */
    protected function orderRules(): array
    {
        $companyId = $this->user()->current_company_id;

        return [
            'order_number' => ['nullable', 'string', 'max:50'],
            'order_date' => ['required', 'date_format:Y-m-d'],
            'required_delivery_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:order_date'],
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')->where('company_id', $companyId)->whereNull('archived_at'),
            ],
            'contract_id' => [
                'required',
                'integer',
                Rule::exists('contracts', 'id')->where('company_id', $companyId)->whereNull('archived_at'),
            ],
            'contract_route_id' => [
                'required',
                'integer',
                Rule::exists('contract_routes', 'id')->where('company_id', $companyId),
            ],
            'destination_id' => [
                'nullable',
                'integer',
                Rule::exists('destinations', 'id')->where('company_id', $companyId),
            ],
            'customer_po_number' => ['nullable', 'string', 'max:100'],
            'applied_price' => ['nullable', 'numeric', 'min:0.01'],
            'override_reason' => ['nullable', 'string', 'max:500'],
            'additional_charges' => ['nullable', 'array'],
            'additional_charges.*.type' => ['required', Rule::in(['return', 'stay', 'stop', 'additional'])],
            'additional_charges.*.enabled' => ['boolean'],
            'additional_charges.*.applied_price' => ['nullable', 'numeric', 'min:0'],
            'cargo_details' => ['nullable', 'array'],
            'cargo_details.description' => ['nullable', 'string', 'max:500'],
            'cargo_details.quantity' => ['nullable', 'numeric', 'min:0'],
            'cargo_details.unit' => ['nullable', 'string', 'max:50'],
            'cargo_details.total_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'loading_instructions' => ['nullable', 'string', 'max:2000'],
            'delivery_instructions' => ['nullable', 'string', 'max:2000'],
            'internal_remarks' => ['nullable', 'string', 'max:2000'],

            'trips' => ['required', 'array', 'min:1'],
            'trips.*.id' => ['nullable', 'integer'],
            'trips.*.planned_pickup_date' => ['required', 'date_format:Y-m-d'],
            'trips.*.planned_delivery_date' => ['required', 'date_format:Y-m-d'],
            'trips.*.truck_id' => [
                'nullable', 'integer',
                Rule::exists('trucks', 'id')->where('company_id', $companyId),
            ],
            'trips.*.driver_id' => [
                'nullable', 'integer',
                Rule::exists('drivers', 'id')->where('company_id', $companyId),
            ],
            'trips.*.truck_amount' => ['nullable', 'numeric', 'min:0'],
            'trips.*.special_notes' => ['nullable', 'string', 'max:1000'],
            'trips.*.cargo_details' => ['nullable', 'array'],
        ];
    }

    /**
     * Cross-field business rules that can't be expressed as simple per-field
     * rules: contract/customer/route relationships, contract validity window,
     * trip date ordering, and price-override authorization.
     */
    protected function validateOrderBusinessRules(Validator $validator): void
    {
        $data = $this->all();

        $contract = isset($data['contract_id'])
            ? Contract::query()->whereKey($data['contract_id'])->first()
            : null;
        $route = isset($data['contract_route_id'])
            ? ContractRoute::query()->whereKey($data['contract_route_id'])->first()
            : null;

        if ($contract && isset($data['customer_id']) && $contract->customer_id !== (int) $data['customer_id']) {
            $validator->errors()->add('contract_id', 'The selected contract does not belong to the selected customer.');
        }

        if ($contract) {
            if ($contract->status === ContractStatus::Cancelled) {
                $validator->errors()->add('contract_id', 'The selected contract has been cancelled.');
            } elseif (isset($data['order_date'])) {
                $orderDate = Carbon::parse($data['order_date']);
                $resolvedAtOrderDate = $contract->resolvedStatus($orderDate);

                if ($resolvedAtOrderDate !== ContractStatus::Active) {
                    $validator->errors()->add('contract_id', 'The selected contract is not active on the order date.');
                } elseif ($orderDate->toDateString() < $contract->contract_date->toDateString()
                    || $orderDate->toDateString() > $contract->expiry_date->toDateString()) {
                    $validator->errors()->add('order_date', 'Order date falls outside the contract validity period.');
                }
            }
        }

        if ($route) {
            if ($contract && $route->contract_id !== $contract->id) {
                $validator->errors()->add('contract_route_id', 'The selected route does not belong to the selected contract.');
            }
            if ($route->price_halalas <= 0) {
                $validator->errors()->add('contract_route_id', 'The contract route rate must be greater than zero.');
            }
        }

        // Price override authorization.
        if ($route && array_key_exists('applied_price', $data) && $data['applied_price'] !== null) {
            $appliedHalalas = Money::sarToHalalas($data['applied_price']);

            if ($appliedHalalas !== $route->price_halalas && ! $this->user()->can('overridePrice', TransportOrder::class)) {
                $validator->errors()->add('applied_price', 'Overriding the contract price requires Admin or Operations Manager permissions.');
            }
        } elseif (! $this->user()->can('overridePrice', TransportOrder::class) && $this->filled('override_reason')) {
            $validator->errors()->add('override_reason', 'Setting an override reason requires Admin or Operations Manager permissions.');
        }

        // Trip date ordering (wildcard-to-wildcard comparisons aren't expressible as simple rules).
        foreach ($data['trips'] ?? [] as $index => $trip) {
            if (! isset($trip['planned_pickup_date'], $trip['planned_delivery_date'])) {
                continue;
            }
            if ($trip['planned_delivery_date'] < $trip['planned_pickup_date']) {
                $validator->errors()->add("trips.{$index}.planned_delivery_date", 'Planned delivery date must be on or after the planned pickup date.');
            }
        }
    }

    /**
     * Normalize the four fixed additional-charge rows (return/stay/stop/additional)
     * against the contract route's own tariffs, converting SAR inputs to halalas.
     *
     * @return array<int, array<string, mixed>>
     */
    public function normalizedAdditionalCharges(ContractRoute $route): array
    {
        $configs = [
            'return' => ['label' => 'Return', 'contract' => $route->return_price_halalas],
            'stay' => ['label' => 'Stay', 'contract' => $route->stay_price_halalas],
            'stop' => ['label' => 'Stop', 'contract' => $route->stop_price_halalas],
            'additional' => ['label' => 'Additional', 'contract' => $route->additional_price_halalas],
        ];

        /** @var array<int, array<string, mixed>> $inputCharges */
        $inputCharges = $this->input('additional_charges', []);
        $byType = collect($inputCharges)->keyBy('type');

        return collect($configs)->map(function (array $config, string $type) use ($byType) {
            $input = $byType->get($type);

            if ($input) {
                $applied = array_key_exists('applied_price', $input) && $input['applied_price'] !== null
                    ? Money::sarToHalalas($input['applied_price'])
                    : $config['contract'];

                return [
                    'type' => $type,
                    'label' => $config['label'],
                    'enabled' => (bool) ($input['enabled'] ?? false),
                    'contract_price_halalas' => $config['contract'],
                    'applied_price_halalas' => $applied,
                ];
            }

            return [
                'type' => $type,
                'label' => $config['label'],
                'enabled' => false,
                'contract_price_halalas' => $config['contract'],
                'applied_price_halalas' => $config['contract'],
            ];
        })->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function normalizedTrips(): array
    {
        /** @var array<int, array<string, mixed>> $trips */
        $trips = $this->input('trips', []);

        return collect($trips)->values()->map(function (array $trip) {
            return [
                'id' => $trip['id'] ?? null,
                'planned_pickup_date' => $trip['planned_pickup_date'],
                'planned_delivery_date' => $trip['planned_delivery_date'],
                'truck_id' => $trip['truck_id'] ?? null,
                'driver_id' => $trip['driver_id'] ?? null,
                'truck_amount_halalas' => Money::sarToHalalas($trip['truck_amount'] ?? null),
                'special_notes' => $trip['special_notes'] ?? null,
                'cargo_details' => $trip['cargo_details'] ?? null,
            ];
        })->all();
    }
}
