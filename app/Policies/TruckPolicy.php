<?php

namespace App\Policies;

use App\Enums\BusinessPermission;
use App\Models\Truck;
use App\Models\User;

class TruckPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::TrucksView);
    }

    public function view(User $user, Truck $truck): bool
    {
        return $this->belongsToCurrentCompany($user, $truck) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::TrucksCreate);
    }

    public function update(User $user, Truck $truck): bool
    {
        return $this->belongsToCurrentCompany($user, $truck)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::TrucksEdit);
    }

    public function delete(User $user, Truck $truck): bool
    {
        return $this->belongsToCurrentCompany($user, $truck)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::TrucksDelete);
    }

    /**
     * Defense in depth: even though queries are already scoped to the
     * current company, never authorize an action against a record from
     * another company that reached here via a guessed/forged route id.
     */
    private function belongsToCurrentCompany(User $user, Truck $truck): bool
    {
        return $truck->company_id === $user->current_company_id;
    }
}
