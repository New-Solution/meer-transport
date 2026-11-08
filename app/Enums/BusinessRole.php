<?php

namespace App\Enums;

enum BusinessRole: string
{
    case Admin = 'admin';
    case OperationsManager = 'operations_manager';
    case Dispatcher = 'dispatcher';
    case Viewer = 'viewer';

    /**
     * Get the display label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::OperationsManager => 'Operations Manager',
            self::Dispatcher => 'Dispatcher',
            self::Viewer => 'Viewer',
        };
    }

    /**
     * Get all the permissions granted to this role.
     *
     * @return array<BusinessPermission>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Admin => BusinessPermission::cases(),
            self::OperationsManager => [
                BusinessPermission::ContractsView,
                BusinessPermission::ContractsCreate,
                BusinessPermission::ContractsEdit,
                BusinessPermission::CustomersView,
                BusinessPermission::CustomersCreate,
                BusinessPermission::CustomersEdit,
                BusinessPermission::OrdersView,
                BusinessPermission::OrdersCreate,
                BusinessPermission::OrdersEdit,
                BusinessPermission::OrdersCancel,
                BusinessPermission::PricingManage,
                BusinessPermission::ReportsView,
                BusinessPermission::TransportOrderPriceOverride,
                BusinessPermission::TrucksView,
                BusinessPermission::TrucksCreate,
                BusinessPermission::TrucksEdit,
                BusinessPermission::TrucksDelete,
                BusinessPermission::DriversView,
                BusinessPermission::DriversCreate,
                BusinessPermission::DriversEdit,
                BusinessPermission::DriversDelete,
                BusinessPermission::DestinationsView,
                BusinessPermission::DestinationsCreate,
                BusinessPermission::DestinationsEdit,
                BusinessPermission::DestinationsDelete,
            ],
            self::Dispatcher => [
                BusinessPermission::ContractsView,
                BusinessPermission::CustomersView,
                BusinessPermission::OrdersView,
                BusinessPermission::OrdersCreate,
                BusinessPermission::OrdersEdit,
                BusinessPermission::ReportsView,
                BusinessPermission::TrucksView,
                BusinessPermission::TrucksCreate,
                BusinessPermission::TrucksEdit,
                BusinessPermission::DriversView,
                BusinessPermission::DriversCreate,
                BusinessPermission::DriversEdit,
                BusinessPermission::DestinationsView,
                BusinessPermission::DestinationsCreate,
                BusinessPermission::DestinationsEdit,
            ],
            self::Viewer => [
                BusinessPermission::ContractsView,
                BusinessPermission::CustomersView,
                BusinessPermission::OrdersView,
                BusinessPermission::ReportsView,
                BusinessPermission::TrucksView,
                BusinessPermission::DriversView,
                BusinessPermission::DestinationsView,
            ],
        };
    }

    /**
     * Determine if the role has the given permission.
     */
    public function hasPermission(BusinessPermission $permission): bool
    {
        return in_array($permission, $this->permissions(), strict: true);
    }

    /**
     * Get all roles as options for assignment UI.
     *
     * @return array<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $role) => ['value' => $role->value, 'label' => $role->label()])
            ->values()
            ->toArray();
    }
}
