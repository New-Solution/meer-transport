import type { ContractStatus } from './contracts';

export type DashboardMetrics = {
    totalCustomers: number;
    totalContracts: number;
    activeContracts: number;
    expiredContracts: number;
    draftContracts: number;
    cancelledContracts: number;
};

export type DashboardContractSummary = {
    id: number;
    contract_number: string;
    customer_name: string;
    customer_cr_number: string;
    contract_date: string;
    expiry_date: string;
    routes_count: number;
    status: ContractStatus;
};

export type DashboardUpcomingExpiration = DashboardContractSummary & {
    days_remaining: number;
};
