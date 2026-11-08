<?php

namespace App\Actions\TransportOrders;

use Illuminate\Support\Facades\DB;

class GenerateOrderNumber
{
    /**
     * Generate the next sequential order number for the current year:
     * TO-{year}-{NNNN}, monotonically increasing per company. Locks the
     * matching rows for the duration of the transaction to avoid a race
     * between concurrent order creations.
     */
    public function handle(int $companyId): string
    {
        $year = now()->year;
        $prefix = "TO-{$year}-";

        $maxNumber = DB::table('transport_orders')
            ->where('company_id', $companyId)
            ->where('order_number', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->max('order_number');

        $nextSeq = $maxNumber
            ? ((int) substr($maxNumber, strlen($prefix))) + 1
            : 1;

        return $prefix.str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
