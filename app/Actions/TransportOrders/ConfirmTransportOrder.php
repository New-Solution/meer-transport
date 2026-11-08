<?php

namespace App\Actions\TransportOrders;

use App\Enums\ContractStatus;
use App\Enums\OrderStatus;
use App\Enums\TripStatus;
use App\Models\Destination;
use App\Models\TransportOrder;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ConfirmTransportOrder
{
    public function handle(TransportOrder $order, User $user): TransportOrder
    {
        if ($order->status === OrderStatus::Confirmed) {
            throw new RuntimeException('Transport order is already confirmed.');
        }
        if ($order->status === OrderStatus::Cancelled) {
            throw new RuntimeException('Cannot confirm a cancelled transport order.');
        }

        return DB::transaction(function () use ($order, $user) {
            $customer = $order->customer;
            if ($customer->archived_at) {
                throw new RuntimeException('Cannot confirm order: Customer is archived or invalid.');
            }

            $contract = $order->contract;
            if ($contract->archived_at) {
                throw new RuntimeException('Cannot confirm order: Contract is archived or invalid.');
            }
            if ($contract->customer_id !== $order->customer_id) {
                throw new RuntimeException('Cannot confirm order: Contract does not belong to the selected customer.');
            }
            if ($contract->status === ContractStatus::Cancelled) {
                throw new RuntimeException('Cannot confirm order: Linked contract has been cancelled.');
            }

            $today = Carbon::today();
            if ($contract->resolvedStatus($today) !== ContractStatus::Active) {
                throw new RuntimeException('Cannot confirm order: Linked contract is not active on the confirmation date.');
            }

            $orderDate = $order->order_date;
            if ($orderDate->toDateString() < $contract->contract_date->toDateString()
                || $orderDate->toDateString() > $contract->expiry_date->toDateString()) {
                throw new RuntimeException('Cannot confirm order: Order date falls outside contract validity period.');
            }
            if ($contract->resolvedStatus($orderDate) !== ContractStatus::Active) {
                throw new RuntimeException('Cannot confirm order: Linked contract was not active on the order date.');
            }

            $route = $order->contractRoute;
            if ($route->contract_id !== $contract->id) {
                throw new RuntimeException('Cannot confirm order: Linked route does not belong to the selected contract.');
            }

            if ($order->price_overridden
                && (! $order->override_authorized_by || ! $order->override_authorized_at || ! $order->override_reason)) {
                throw new RuntimeException('Cannot confirm order: Price override lacks required audit authorization fields.');
            }
            if ($order->applied_price_halalas <= 0) {
                throw new RuntimeException('Cannot confirm order: Applied price must be greater than zero.');
            }

            $trips = $order->trips;
            if ($trips->isEmpty()) {
                throw new RuntimeException('Cannot confirm order: At least one transport trip is required.');
            }
            foreach ($trips as $trip) {
                if ($trip->planned_delivery_date->toDateString() < $trip->planned_pickup_date->toDateString()) {
                    throw new RuntimeException('Cannot confirm order: Planned delivery date must be on or after pickup date.');
                }
            }

            // Freeze fresh snapshots at confirmation time.
            $destinationId = $order->route_snapshot['destination_id'] ?? $route->destination_id;
            $destination = $destinationId ? Destination::query()->whereKey($destinationId)->first() : null;

            $order->update([
                'customer_snapshot' => CreateTransportOrder::customerSnapshot($customer),
                'contract_snapshot' => CreateTransportOrder::contractSnapshot($contract),
                'route_snapshot' => CreateTransportOrder::routeSnapshot($route, $destinationId, $destination),
                'status' => OrderStatus::Confirmed,
                'confirmed_at' => now(),
                'confirmed_by' => $user->name,
            ]);

            $order->trips()->update(['status' => TripStatus::Confirmed]);

            return $order->fresh('trips');
        });
    }
}
