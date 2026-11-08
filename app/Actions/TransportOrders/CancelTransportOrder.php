<?php

namespace App\Actions\TransportOrders;

use App\Enums\OrderStatus;
use App\Enums\TripStatus;
use App\Models\TransportOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CancelTransportOrder
{
    public function handle(TransportOrder $order, User $user, string $reason): TransportOrder
    {
        if ($order->status === OrderStatus::Cancelled) {
            throw new RuntimeException('Transport order is already cancelled.');
        }

        if (trim($reason) === '') {
            throw new RuntimeException('Cancellation reason is required.');
        }

        return DB::transaction(function () use ($order, $user, $reason) {
            $order->update([
                'status' => OrderStatus::Cancelled,
                'cancelled_at' => now(),
                'cancelled_by' => $user->name,
                'cancellation_reason' => trim($reason),
            ]);

            $order->trips()->update(['status' => TripStatus::Cancelled]);

            return $order->fresh('trips');
        });
    }
}
