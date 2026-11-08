import type { ContractStatus } from './contracts';

export type ReportTab =
    | 'customer-contracts'
    | 'active-contracts'
    | 'expired-contracts'
    | 'contract-routes';

export type CustomerContractsReportRow = {
    contract_id: number;
    contract_number: string;
    customer_id: number;
    customer_name: string;
    customer_cr_number: string;
    contract_date: string;
    expiry_date: string;
    routes_count: number;
    status: ContractStatus;
};

export type ContractRoutesReportRow = {
    route_id: number;
    contract_id: number;
    contract_number: string;
    customer_id: number;
    customer_name: string;
    from_city: string;
    to_city: string;
    vehicle_type: string;
    price: number;
    contract_status: ContractStatus;
};

export type ReportCustomerOption = {
    id: number;
    name: string;
    cr_number: string;
};

export type ReportFilters = {
    customer_id: number | null;
    from_date: string;
    to_date: string;
    status: string;
    contract_number: string;
    from_city: string;
    to_city: string;
    vehicle_type: string;
};
