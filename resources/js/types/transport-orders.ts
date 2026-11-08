export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export type CargoDetails = {
    description?: string;
    quantity?: number;
    unit?: string;
    total_weight_kg?: number;
};

export type TransportOrderListItem = {
    id: number;
    order_number: string;
    customer_po_number: string | null;
    customer_name: string;
    customer_cr_number: string;
    order_date: string;
    required_delivery_date: string;
    from_city: string;
    to_city: string;
    vehicle_type: string;
    contract_number: string;
    applied_price: number;
    price_overridden: boolean;
    status: OrderStatus;
    trip_count: number;
    total_amount: number;
};

export type AdditionalChargeDetail = {
    type: 'return' | 'stay' | 'stop' | 'additional';
    label: string;
    enabled: boolean;
    contract_price: number;
    applied_price: number;
};

export type TripDetail = {
    id: number;
    trip_number: string;
    sequence_number: number;
    status: OrderStatus;
    from_city: string;
    to_city: string;
    planned_pickup_date: string;
    planned_delivery_date: string;
    truck_id: number | null;
    truck_plate: string | null;
    driver_id: number | null;
    driver_name: string | null;
    truck_amount: number;
    special_notes: string | null;
    cargo_details: CargoDetails | null;
};

export type OrderRouteSnapshot = {
    from_city: string;
    to_city: string;
    destination_id: number | null;
    destination_name: string | null;
    destination_google_maps_url: string | null;
    vehicle_type: string;
    original_price_halalas: number;
};

export type TransportOrderDetail = {
    id: number;
    order_number: string;
    order_date: string;
    required_delivery_date: string;
    customer_id: number;
    customer_snapshot: { name: string; cr_number: string; vat_number: string };
    contract_id: number;
    contract_snapshot: { contract_number: string };
    contract_route_id: number;
    route_snapshot: OrderRouteSnapshot;
    customer_po_number: string | null;
    applied_price: number;
    price_overridden: boolean;
    override_reason: string | null;
    override_authorized_by: string | null;
    override_authorized_at: string | null;
    trip_count: number;
    total_amount: number;
    additional_charges: AdditionalChargeDetail[];
    currency: string;
    status: OrderStatus;
    cargo_details: CargoDetails | null;
    loading_instructions: string | null;
    delivery_instructions: string | null;
    internal_remarks: string | null;
    confirmed_at: string | null;
    confirmed_by: string | null;
    cancelled_at: string | null;
    cancelled_by: string | null;
    cancellation_reason: string | null;
    trips: TripDetail[];
};

export type OrderRouteOption = {
    id: number;
    from_city: string;
    to_city: string;
    destination_id: number | null;
    vehicle_type: string;
    price: number;
    return_price: number;
    stay_price: number;
    stop_price: number;
    additional_price: number;
};

export type OrderContractOption = {
    id: number;
    contract_number: string;
    customer_id: number;
    contract_date: string;
    expiry_date: string;
    routes: OrderRouteOption[];
};

export type OrderCustomerOption = {
    id: number;
    name: string;
    cr_number: string;
};

export type OrderTruckOption = {
    id: number;
    license_plate: string;
    vehicle_type: string;
};

export type OrderDriverOption = {
    id: number;
    first_name: string;
    last_name: string;
};

export type OrderDestinationOption = {
    id: number;
    name: string;
    google_maps_url: string;
};
