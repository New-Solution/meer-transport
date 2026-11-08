<?php

namespace App\Policies;

use App\Enums\BusinessPermission;
use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::CustomersView);
    }

    public function view(User $user, Customer $customer): bool
    {
        return $this->belongsToCurrentCompany($user, $customer) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::CustomersCreate);
    }

    public function update(User $user, Customer $customer): bool
    {
        return $this->belongsToCurrentCompany($user, $customer)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::CustomersEdit);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $this->belongsToCurrentCompany($user, $customer)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::CustomersDelete);
    }

    /**
     * Defense in depth: even though queries are already scoped to the
     * current company, never authorize an action against a record from
     * another company that reached here via a guessed/forged route id.
     */
    private function belongsToCurrentCompany(User $user, Customer $customer): bool
    {
        return $customer->company_id === $user->current_company_id;
    }
}
