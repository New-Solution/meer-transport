<?php

namespace App\Actions\Contracts;

use App\Enums\ContractStatus;
use App\Models\Contract;
use RuntimeException;

class CancelContract
{
    public function handle(Contract $contract, string $cancelledBy, ?string $reason = null): Contract
    {
        if ($contract->status === ContractStatus::Cancelled) {
            throw new RuntimeException("Contract {$contract->contract_number} is already cancelled.");
        }

        $contract->update([
            'status' => ContractStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => $cancelledBy,
            'cancellation_reason' => trim((string) $reason) ?: 'Manually cancelled by operations user',
        ]);

        return $contract;
    }
}
