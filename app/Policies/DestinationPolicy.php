<?php

namespace App\Policies;

use App\Enums\BusinessPermission;
use App\Models\Destination;
use App\Models\User;

class DestinationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DestinationsView);
    }

    public function view(User $user, Destination $destination): bool
    {
        return $this->belongsToCurrentCompany($user, $destination) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DestinationsCreate);
    }

    public function update(User $user, Destination $destination): bool
    {
        return $this->belongsToCurrentCompany($user, $destination)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DestinationsEdit);
    }

    public function delete(User $user, Destination $destination): bool
    {
        return $this->belongsToCurrentCompany($user, $destination)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::DestinationsDelete);
    }

    /**
     * Defense in depth: even though queries are already scoped to the
     * current company, never authorize an action against a record from
     * another company that reached here via a guessed/forged route id.
     */
    private function belongsToCurrentCompany(User $user, Destination $destination): bool
    {
        return $destination->company_id === $user->current_company_id;
    }
}
