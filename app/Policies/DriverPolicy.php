<?php

namespace App\Policies;

use App\Enums\BusinessPermission;
use App\Models\Driver;
use App\Models\User;

class DriverPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DriversView);
    }

    public function view(User $user, Driver $driver): bool
    {
        return $this->belongsToCurrentCompany($user, $driver) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DriversCreate);
    }

    public function update(User $user, Driver $driver): bool
    {
        return $this->belongsToCurrentCompany($user, $driver)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DriversEdit);
    }

    public function delete(User $user, Driver $driver): bool
    {
        return $this->belongsToCurrentCompany($user, $driver)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DriversDelete);
    }

    /**
     * Defense in depth: even though queries are already scoped to the
     * current company, never authorize an action against a record from
     * another company that reached here via a guessed/forged route id.
     */
    private function belongsToCurrentCompany(User $user, Driver $driver): bool
    {
        return $driver->company_id === $user->current_company_id;
    }
}
