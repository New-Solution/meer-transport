<?php

namespace App\Enums;

enum BusinessPermission: string
{
    case ContractsView = 'contracts:view';
    case ContractsCreate = 'contracts:create';
    case ContractsEdit = 'contracts:edit';
    case ContractsDelete = 'contracts:delete';

    case CustomersView = 'customers:view';
    case CustomersCreate = 'customers:create';
    case CustomersEdit = 'customers:edit';
    case CustomersDelete = 'customers:delete';

    case OrdersView = 'orders:view';
    case OrdersCreate = 'orders:create';
    case OrdersEdit = 'orders:edit';
    case OrdersCancel = 'orders:cancel';
    case OrdersDelete = 'orders:delete';

    case PricingManage = 'pricing:manage';
    case ReportsView = 'reports:view';
    case SettingsManage = 'settings:manage';

    case TransportOrderPriceOverride = 'transport_order:price_override';

    case TrucksView = 'trucks:view';
    case TrucksCreate = 'trucks:create';
    case TrucksEdit = 'trucks:edit';
    case TrucksDelete = 'trucks:delete';

    case DriversView = 'drivers:view';
    case DriversCreate = 'drivers:create';
    case DriversEdit = 'drivers:edit';
    case DriversDelete = 'drivers:delete';

    case DestinationsView = 'destinations:view';
    case DestinationsCreate = 'destinations:create';
    case DestinationsEdit = 'destinations:edit';
    case DestinationsDelete = 'destinations:delete';
}
