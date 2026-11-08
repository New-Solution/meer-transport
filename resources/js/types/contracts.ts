export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type ContractListItem = {
    id: number;
    contract_number: string;
    customer_name: string;
    customer_cr_number: string;
    contract_date: string;
    expiry_date: string;
    status: ContractStatus;
    routes_count: number;
};

export type ContractRouteDetail = {
    id: number;
    from_city: string;
    to_city: string;
    destination_id: number | null;
    destination_name: string | null;
    vehicle_type: string;
    price: number;
    return_price: number;
    stay_price: number;
    stop_price: number;
    additional_price: number;
};

export type CustomerSnapshot = {
    id: number;
    name: string;
    cr_number: string;
    unified_number: string;
    vat_number: string;
    address: string;
    snapshot_at: string;
};

export type ContractDetail = {
    id: number;
    contract_number: string;
    customer_id: number;
    customer_snapshot: CustomerSnapshot;
    contract_date: string;
    expiry_date: string;
    status: ContractStatus;
    resolved_status: ContractStatus;
    cancelled_at: string | null;
    cancelled_by: string | null;
    cancellation_reason: string | null;
    archived_at: string | null;
    routes: ContractRouteDetail[];
};

export type ContractCustomerOption = {
    id: number;
    name: string;
    cr_number: string;
};

export type ContractDestinationOption = {
    id: number;
    name: string;
};
