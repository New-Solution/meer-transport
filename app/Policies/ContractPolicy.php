<?php

namespace App\Policies;

use App\Enums\BusinessPermission;
use App\Models\Contract;
use App\Models\User;

class ContractPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::ContractsView);
    }

    public function view(User $user, Contract $contract): bool
    {
        return $this->belongsToCurrentCompany($user, $contract) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::ContractsCreate);
    }

    public function update(User $user, Contract $contract): bool
    {
        return $this->belongsToCurrentCompany($user, $contract)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::ContractsEdit);
    }

    public function delete(User $user, Contract $contract): bool
    {
        return $this->belongsToCurrentCompany($user, $contract)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::ContractsDelete);
    }

    /**
     * Defense in depth: even though queries are already scoped to the
     * current company, never authorize an action against a record from
     * another company that reached here via a guessed/forged route id.
     */
    private function belongsToCurrentCompany(User $user, Contract $contract): bool
    {
        return $contract->company_id === $user->current_company_id;
    }
}
