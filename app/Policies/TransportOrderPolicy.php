<?php

namespace App\Policies;

use App\Enums\BusinessPermission;
use App\Models\TransportOrder;
use App\Models\User;

class TransportOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::OrdersView);
    }

    public function view(User $user, TransportOrder $order): bool
    {
        return $this->belongsToCurrentCompany($user, $order) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::OrdersCreate);
    }

    public function update(User $user, TransportOrder $order): bool
    {
        return $this->belongsToCurrentCompany($user, $order)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::OrdersEdit);
    }

    public function cancel(User $user, TransportOrder $order): bool
    {
        return $this->belongsToCurrentCompany($user, $order)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::OrdersCancel);
    }

    public function delete(User $user, TransportOrder $order): bool
    {
        return $this->belongsToCurrentCompany($user, $order)
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::OrdersDelete);
    }

    public function overridePrice(User $user): bool
    {
        return $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::TransportOrderPriceOverride);
    }

    /**
     * Defense in depth: even though queries are already scoped to the
     * current company, never authorize an action against a record from
     * another company that reached here via a guessed/forged route id.
     */
    private function belongsToCurrentCompany(User $user, TransportOrder $order): bool
    {
        return $order->company_id === $user->current_company_id;
    }
}
