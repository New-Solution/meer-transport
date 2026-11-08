<?php

namespace App\Actions\TransportOrders;

use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use App\Models\Destination;
use App\Models\TransportOrder;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class UpdateTransportOrder
{
    /**
     * @param  array<string, mixed>  $data  Validated order fields (see ValidatesTransportOrder::orderRules()).
     * @param  array<int, array<string, mixed>>  $additionalCharges  Normalized additional charges.
     * @param  array<int, array<string, mixed>>  $trips  Normalized trips (see ValidatesTransportOrder::normalizedTrips()).
     */
    public function handle(TransportOrder $order, array $data, array $additionalCharges, array $trips, User $user): TransportOrder
    {
        if ($order->status->value !== 'DRAFT') {
            throw new RuntimeException('Only DRAFT transport orders can be modified.');
        }

        return DB::transaction(function () use ($order, $data, $additionalCharges, $trips, $user) {
            $customer = Customer::query()->whereKey($data['customer_id'])->firstOrFail();
            $contract = Contract::query()->whereKey($data['contract_id'])->firstOrFail();
            $route = ContractRoute::query()->whereKey($data['contract_route_id'])->firstOrFail();

            $contractRate = $route->price_halalas;
            $appliedPriceHalalas = array_key_exists('applied_price', $data) && $data['applied_price'] !== null
                ? Money::sarToHalalas($data['applied_price'])
                : $contractRate;
            $priceOverridden = $appliedPriceHalalas !== $contractRate;

            $effectiveDestinationId = array_key_exists('destination_id', $data) && $data['destination_id'] !== null
                ? (int) $data['destination_id']
                : $route->destination_id;
            $destination = $effectiveDestinationId
                ? Destination::query()->whereKey($effectiveDestinationId)->first()
                : null;

            $tripCount = count($trips);
            $truckAmountTotal = array_sum(array_column($trips, 'truck_amount_halalas'));
            $additionalChargesTotal = collect($additionalCharges)
                ->filter(fn (array $charge) => $charge['enabled'])
                ->sum('applied_price_halalas');
            $totalAmountHalalas = ($appliedPriceHalalas * $tripCount) + $additionalChargesTotal + $truckAmountTotal;

            $order->update([
                'order_date' => $data['order_date'],
                'required_delivery_date' => $data['required_delivery_date'],
                'customer_id' => $customer->id,
                'customer_snapshot' => CreateTransportOrder::customerSnapshot($customer),
                'contract_id' => $contract->id,
                'contract_snapshot' => CreateTransportOrder::contractSnapshot($contract),
                'contract_route_id' => $route->id,
                'route_snapshot' => CreateTransportOrder::routeSnapshot($route, $effectiveDestinationId, $destination),
                'customer_po_number' => $data['customer_po_number'] ?? null,
                'applied_price_halalas' => $appliedPriceHalalas,
                'price_overridden' => $priceOverridden,
                'override_reason' => $priceOverridden ? (($data['override_reason'] ?? null) ?: 'Manual rate adjustment') : null,
                'override_authorized_by' => $priceOverridden ? $user->name : null,
                'override_authorized_at' => $priceOverridden ? now() : null,
                'trip_count' => $tripCount,
                'total_amount_halalas' => $totalAmountHalalas,
                'additional_charges' => $additionalCharges,
                'cargo_details' => $data['cargo_details'] ?? null,
                'loading_instructions' => $data['loading_instructions'] ?? null,
                'delivery_instructions' => $data['delivery_instructions'] ?? null,
                'internal_remarks' => $data['internal_remarks'] ?? null,
            ]);

            // Replace the full trip set atomically, matching the contract
            // routes' "full replace" semantics rather than diffing in place.
            $order->trips()->delete();

            foreach ($trips as $index => $trip) {
                $sequence = $index + 1;

                $order->trips()->create([
                    'trip_number' => "{$order->order_number}-TRIP-".str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                    'sequence_number' => $sequence,
                    'status' => 'DRAFT',
                    'from_city' => $route->from_city,
                    'to_city' => $route->to_city,
                    'vehicle_type' => $route->vehicle_type,
                    'applied_price_halalas' => $appliedPriceHalalas,
                    'planned_pickup_date' => $trip['planned_pickup_date'],
                    'planned_delivery_date' => $trip['planned_delivery_date'],
                    'cargo_details' => $trip['cargo_details'],
                    'special_notes' => $trip['special_notes'],
                    'truck_id' => $trip['truck_id'],
                    'driver_id' => $trip['driver_id'],
                    'truck_amount_halalas' => $trip['truck_amount_halalas'],
                ]);
            }

            return $order->fresh('trips');
        });
    }
}
