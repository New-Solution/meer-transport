<?php

namespace App\Http\Controllers;

use App\Actions\TransportOrders\CancelTransportOrder;
use App\Actions\TransportOrders\ConfirmTransportOrder;
use App\Actions\TransportOrders\CreateTransportOrder;
use App\Actions\TransportOrders\UpdateTransportOrder;
use App\Enums\OrderStatus;
use App\Http\Requests\TransportOrders\StoreTransportOrderRequest;
use App\Http\Requests\TransportOrders\UpdateTransportOrderRequest;
use App\Models\Company;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use App\Models\Destination;
use App\Models\Driver;
use App\Models\TransportOrder;
use App\Models\Truck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class TransportOrderController extends Controller
{
    public function index(Request $request, Company $current_company): Response
    {
        Gate::authorize('viewAny', TransportOrder::class);

        $query = TransportOrder::query();

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($customerId = $request->integer('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($query) use ($search) {
                $query->where('order_number', 'like', "%{$search}%")
                    ->orWhereRaw("JSON_EXTRACT(customer_snapshot, '$.name') LIKE ?", ["%{$search}%"])
                    ->orWhere('customer_po_number', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderByDesc('order_date')->latest()->get();

        return Inertia::render('transport-orders/index', [
            'orders' => $orders->map(fn (TransportOrder $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_snapshot['name'],
                'order_date' => $order->order_date->toDateString(),
                'required_delivery_date' => $order->required_delivery_date->toDateString(),
                'status' => $order->status->value,
                'trip_count' => $order->trip_count,
                'total_amount' => $order->total_amount_halalas / 100,
            ]),
            'filters' => [
                'search' => $search ?: '',
                'status' => $status ?: '',
                'customerId' => $customerId ?: null,
            ],
        ]);
    }

    public function create(Company $current_company): Response
    {
        Gate::authorize('create', TransportOrder::class);

        return Inertia::render('transport-orders/form', [
            'order' => null,
            ...$this->formOptions(),
        ]);
    }

    public function store(StoreTransportOrderRequest $request, Company $current_company, CreateTransportOrder $createOrder): RedirectResponse
    {
        $data = $request->safe()->except(['trips', 'additional_charges']);
        $contractRoute = ContractRoute::query()->whereKey($data['contract_route_id'])->firstOrFail();

        try {
            $order = $createOrder->handle(
                $data,
                $request->normalizedAdditionalCharges($contractRoute),
                $request->normalizedTrips(),
                $request->user(),
            );
        } catch (RuntimeException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back()->withInput();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Transport order created.')]);

        return to_route('transport-orders.show', ['current_company' => $current_company->slug, 'transport_order' => $order->id]);
    }

    public function show(Company $current_company, TransportOrder $transport_order): Response
    {
        Gate::authorize('view', $transport_order);

        $transport_order->load(['trips.truck', 'trips.driver']);

        return Inertia::render('transport-orders/show', [
            'order' => $this->toDetail($transport_order),
        ]);
    }

    public function edit(Company $current_company, TransportOrder $transport_order): Response
    {
        Gate::authorize('update', $transport_order);

        $transport_order->load('trips');

        return Inertia::render('transport-orders/form', [
            'order' => $this->toDetail($transport_order),
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateTransportOrderRequest $request, Company $current_company, TransportOrder $transport_order, UpdateTransportOrder $updateOrder): RedirectResponse
    {
        $data = $request->safe()->except(['trips', 'additional_charges']);
        $contractRoute = ContractRoute::query()->whereKey($data['contract_route_id'])->firstOrFail();

        try {
            $updateOrder->handle(
                $transport_order,
                $data,
                $request->normalizedAdditionalCharges($contractRoute),
                $request->normalizedTrips(),
                $request->user(),
            );
        } catch (RuntimeException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back()->withInput();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Transport order updated.')]);

        return to_route('transport-orders.show', ['current_company' => $current_company->slug, 'transport_order' => $transport_order->id]);
    }

    public function confirm(Company $current_company, TransportOrder $transport_order, ConfirmTransportOrder $confirmOrder): RedirectResponse
    {
        Gate::authorize('update', $transport_order);

        try {
            $confirmOrder->handle($transport_order, request()->user());
        } catch (RuntimeException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Transport order confirmed.')]);

        return back();
    }

    public function cancel(Request $request, Company $current_company, TransportOrder $transport_order, CancelTransportOrder $cancelOrder): RedirectResponse
    {
        Gate::authorize('cancel', $transport_order);

        try {
            $cancelOrder->handle($transport_order, $request->user(), $request->string('reason')->toString());
        } catch (RuntimeException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Transport order cancelled.')]);

        return back();
    }

    public function destroy(Company $current_company, TransportOrder $transport_order): RedirectResponse
    {
        Gate::authorize('delete', $transport_order);

        if ($transport_order->status !== OrderStatus::Draft) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Only DRAFT transport orders can be deleted. Confirmed or cancelled orders must be preserved.'),
            ]);

            return back();
        }

        $transport_order->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Transport order deleted.')]);

        return to_route('transport-orders.index', ['current_company' => $current_company->slug]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'canOverridePrice' => Gate::allows('overridePrice', TransportOrder::class),
            'customers' => Customer::query()->active()->orderBy('name')->get(['id', 'name']),
            'contracts' => Contract::query()
                ->eligibleForOrders()
                ->with('routes')
                ->get()
                ->map(fn (Contract $contract) => [
                    'id' => $contract->id,
                    'contract_number' => $contract->contract_number,
                    'customer_id' => $contract->customer_id,
                    'contract_date' => $contract->contract_date->toDateString(),
                    'expiry_date' => $contract->expiry_date->toDateString(),
                    'routes' => $contract->routes->map(fn ($route) => [
                        'id' => $route->id,
                        'from_city' => $route->from_city,
                        'to_city' => $route->to_city,
                        'destination_id' => $route->destination_id,
                        'price' => $route->price_halalas / 100,
                        'return_price' => $route->return_price_halalas / 100,
                        'stay_price' => $route->stay_price_halalas / 100,
                        'stop_price' => $route->stop_price_halalas / 100,
                        'additional_price' => $route->additional_price_halalas / 100,
                    ]),
                ]),
            'destinations' => Destination::query()->orderBy('name')->get(['id', 'name']),
            'trucks' => Truck::query()->orderBy('license_plate')->get(['id', 'license_plate']),
            'drivers' => Driver::query()->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toDetail(TransportOrder $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_date' => $order->order_date->toDateString(),
            'required_delivery_date' => $order->required_delivery_date->toDateString(),
            'customer_id' => $order->customer_id,
            'customer_snapshot' => $order->customer_snapshot,
            'contract_id' => $order->contract_id,
            'contract_snapshot' => $order->contract_snapshot,
            'contract_route_id' => $order->contract_route_id,
            'route_snapshot' => $order->route_snapshot,
            'customer_po_number' => $order->customer_po_number,
            'applied_price' => $order->applied_price_halalas / 100,
            'price_overridden' => $order->price_overridden,
            'override_reason' => $order->override_reason,
            'override_authorized_by' => $order->override_authorized_by,
            'override_authorized_at' => $order->override_authorized_at?->toIso8601String(),
            'trip_count' => $order->trip_count,
            'total_amount' => $order->total_amount_halalas / 100,
            'additional_charges' => collect($order->additional_charges)->map(fn (array $charge) => [
                'type' => $charge['type'],
                'label' => $charge['label'],
                'enabled' => $charge['enabled'],
                'contract_price' => $charge['contract_price_halalas'] / 100,
                'applied_price' => $charge['applied_price_halalas'] / 100,
            ]),
            'currency' => $order->currency,
            'status' => $order->status->value,
            'cargo_details' => $order->cargo_details,
            'loading_instructions' => $order->loading_instructions,
            'delivery_instructions' => $order->delivery_instructions,
            'internal_remarks' => $order->internal_remarks,
            'confirmed_at' => $order->confirmed_at?->toIso8601String(),
            'confirmed_by' => $order->confirmed_by,
            'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            'cancelled_by' => $order->cancelled_by,
            'cancellation_reason' => $order->cancellation_reason,
            'trips' => $order->trips->map(fn ($trip) => [
                'id' => $trip->id,
                'trip_number' => $trip->trip_number,
                'sequence_number' => $trip->sequence_number,
                'status' => $trip->status->value,
                'from_city' => $trip->from_city,
                'to_city' => $trip->to_city,
                'planned_pickup_date' => $trip->planned_pickup_date->toDateString(),
                'planned_delivery_date' => $trip->planned_delivery_date->toDateString(),
                'truck_id' => $trip->truck_id,
                'truck_plate' => $trip->truck?->license_plate,
                'driver_id' => $trip->driver_id,
                'driver_name' => $trip->driver ? "{$trip->driver->first_name} {$trip->driver->last_name}" : null,
                'truck_amount' => $trip->truck_amount_halalas / 100,
                'special_notes' => $trip->special_notes,
                'cargo_details' => $trip->cargo_details,
            ]),
        ];
    }
}
