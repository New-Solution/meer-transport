<?php

namespace App\Actions\Contracts;

use App\Enums\ContractStatus;
use App\Models\Contract;
use Illuminate\Support\Carbon;
use RuntimeException;

class ActivateContract
{
    public function handle(Contract $contract): Contract
    {
        if ($contract->status !== ContractStatus::Draft) {
            throw new RuntimeException("Only DRAFT contracts can be activated. Current status is {$contract->status->value}.");
        }

        if (Carbon::today()->toDateString() > $contract->expiry_date->toDateString()) {
            throw new RuntimeException("Cannot activate contract {$contract->contract_number} because its expiry date has already passed.");
        }

        $contract->update(['status' => ContractStatus::Active]);

        return $contract;
    }
}
