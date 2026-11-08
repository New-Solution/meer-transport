import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileText,
    Info,
    Route as RouteIcon,
    RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import { download as exportCsv, index } from '@/routes/reports';
import type {
    Company,
    ContractRoutesReportRow,
    CustomerContractsReportRow,
    ReportCustomerOption,
    ReportFilters,
    ReportTab,
} from '@/types';

type Props = {
    activeTab: ReportTab;
    rows: CustomerContractsReportRow[] | ContractRoutesReportRow[];
    filters: ReportFilters;
    customers: ReportCustomerOption[];
    currentCompany: Company;
};

const statusVariant: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    ACTIVE: 'default',
    DRAFT: 'secondary',
    EXPIRED: 'outline',
    CANCELLED: 'destructive',
};

const TABS: { value: ReportTab; label: string; icon: typeof FileText }[] = [
    {
        value: 'customer-contracts',
        label: 'Customer Contracts',
        icon: FileText,
    },
    {
        value: 'active-contracts',
        label: 'Active Contracts',
        icon: CheckCircle2,
    },
    {
        value: 'expired-contracts',
        label: 'Expired Contracts',
        icon: AlertCircle,
    },
    {
        value: 'contract-routes',
        label: 'Contract Routes and Prices',
        icon: RouteIcon,
    },
];

export default function ReportsIndex({
    activeTab,
    rows,
    filters,
    customers,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;
    const [contractNumberDraft, setContractNumberDraft] = useState(
        filters.contract_number,
    );
    const [fromCityDraft, setFromCityDraft] = useState(filters.from_city);
    const [toCityDraft, setToCityDraft] = useState(filters.to_city);

    const go = (tab: ReportTab, next: Partial<ReportFilters> = {}) => {
        router.get(
            index({ current_company: companySlug }),
            { tab, ...filters, ...next },
            { preserveState: true, replace: true },
        );
    };

    const switchTab = (tab: ReportTab) => {
        router.get(
            index({ current_company: companySlug }),
            { tab },
            { preserveState: true, replace: true },
        );
    };

    const exportHref = () => {
        const params = new URLSearchParams();
        params.set('tab', activeTab);
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== '') {
                params.set(key, String(value));
            }
        });

        return `${exportCsv.url({ current_company: companySlug })}?${params.toString()}`;
    };

    const isReportA = activeTab === 'customer-contracts';
    const isReportD = activeTab === 'contract-routes';
    const contractRows = rows as CustomerContractsReportRow[];
    const routeRows = rows as ContractRoutesReportRow[];

    const hasActiveFiltersA =
        filters.customer_id ||
        filters.from_date ||
        filters.to_date ||
        filters.status !== 'ALL';

    const hasActiveFiltersD =
        filters.customer_id ||
        filters.contract_number ||
        filters.from_city ||
        filters.to_city ||
        filters.status !== 'ALL';

    const resetFiltersA = () => {
        setContractNumberDraft('');
        go('customer-contracts', {
            customer_id: null,
            from_date: '',
            to_date: '',
            status: 'ALL',
        });
    };

    const resetFiltersD = () => {
        setContractNumberDraft('');
        setFromCityDraft('');
        setToCityDraft('');
        go('contract-routes', {
            customer_id: null,
            contract_number: '',
            from_city: '',
            to_city: '',
            status: 'ALL',
        });
    };

    return (
        <>
            <Head title="Reports" />

            <div className="flex flex-col space-y-6 p-4">
                <Heading
                    title="Reports"
                    description="Transportation contract and route reporting"
                />

                <div className="flex flex-wrap items-center gap-2 border-b pb-3">
                    {TABS.map(({ value, label, icon: Icon }) => (
                        <Button
                            key={value}
                            type="button"
                            variant={
                                activeTab === value ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => switchTab(value)}
                            data-test={`report-tab-${value}`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </Button>
                    ))}
                </div>

                {isReportA ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-1">
                                <Label>Customer</Label>
                                <Select
                                    value={
                                        filters.customer_id
                                            ? String(filters.customer_id)
                                            : 'ALL'
                                    }
                                    onValueChange={(value) =>
                                        go('customer-contracts', {
                                            customer_id:
                                                value === 'ALL'
                                                    ? null
                                                    : Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All customers
                                        </SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem
                                                key={customer.id}
                                                value={String(customer.id)}
                                            >
                                                {customer.name} (
                                                {customer.cr_number})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label>Contract date from</Label>
                                <Input
                                    type="date"
                                    value={filters.from_date}
                                    onChange={(e) =>
                                        go('customer-contracts', {
                                            from_date: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Contract date to</Label>
                                <Input
                                    type="date"
                                    value={filters.to_date}
                                    onChange={(e) =>
                                        go('customer-contracts', {
                                            to_date: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Status</Label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) =>
                                        go('customer-contracts', {
                                            status: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All statuses
                                        </SelectItem>
                                        <SelectItem value="DRAFT">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="ACTIVE">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="EXPIRED">
                                            Expired
                                        </SelectItem>
                                        <SelectItem value="CANCELLED">
                                            Cancelled
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Showing{' '}
                                <strong className="text-foreground">
                                    {contractRows.length}
                                </strong>{' '}
                                contract{contractRows.length === 1 ? '' : 's'}
                            </span>
                            <div className="flex items-center gap-2">
                                {hasActiveFiltersA ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetFiltersA}
                                    >
                                        <RotateCcw className="h-3 w-3" /> Reset
                                        filters
                                    </Button>
                                ) : null}
                                <Button
                                    asChild
                                    size="sm"
                                    disabled={contractRows.length === 0}
                                >
                                    <a href={exportHref()}>
                                        <Download className="h-3.5 w-3.5" />{' '}
                                        Export CSV
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <CustomerContractsTable
                            rows={contractRows}
                            companySlug={companySlug}
                        />
                    </div>
                ) : null}

                {activeTab === 'active-contracts' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                        Eligible for transport orders
                                    </p>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                        Active contracts whose validity window
                                        covers today. Cancelled, draft, and
                                        expired contracts are excluded.
                                    </p>
                                </div>
                            </div>
                            <Button
                                asChild
                                size="sm"
                                disabled={contractRows.length === 0}
                            >
                                <a href={exportHref()}>
                                    <Download className="h-3.5 w-3.5" /> Export
                                    CSV
                                </a>
                            </Button>
                        </div>

                        <CustomerContractsTable
                            rows={contractRows}
                            companySlug={companySlug}
                        />
                    </div>
                ) : null}

                {activeTab === 'expired-contracts' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                                <div>
                                    <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                                        Past expiry date
                                    </p>
                                    <p className="text-xs text-rose-700 dark:text-rose-400">
                                        Contracts whose validity cutoff has
                                        passed. Cancelled contracts are
                                        excluded.
                                    </p>
                                </div>
                            </div>
                            <Button
                                asChild
                                size="sm"
                                disabled={contractRows.length === 0}
                            >
                                <a href={exportHref()}>
                                    <Download className="h-3.5 w-3.5" /> Export
                                    CSV
                                </a>
                            </Button>
                        </div>

                        <CustomerContractsTable
                            rows={contractRows}
                            companySlug={companySlug}
                        />
                    </div>
                ) : null}

                {isReportD ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-1 lg:col-span-2">
                                <Label>Customer</Label>
                                <Select
                                    value={
                                        filters.customer_id
                                            ? String(filters.customer_id)
                                            : 'ALL'
                                    }
                                    onValueChange={(value) =>
                                        go('contract-routes', {
                                            customer_id:
                                                value === 'ALL'
                                                    ? null
                                                    : Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All customers
                                        </SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem
                                                key={customer.id}
                                                value={String(customer.id)}
                                            >
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label>Contract #</Label>
                                <Input
                                    placeholder="Search #"
                                    value={contractNumberDraft}
                                    onChange={(e) =>
                                        setContractNumberDraft(e.target.value)
                                    }
                                    onBlur={() =>
                                        go('contract-routes', {
                                            contract_number:
                                                contractNumberDraft,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>From city</Label>
                                <Input
                                    placeholder="e.g. Riyadh"
                                    value={fromCityDraft}
                                    onChange={(e) =>
                                        setFromCityDraft(e.target.value)
                                    }
                                    onBlur={() =>
                                        go('contract-routes', {
                                            from_city: fromCityDraft,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>To city</Label>
                                <Input
                                    placeholder="e.g. Jeddah"
                                    value={toCityDraft}
                                    onChange={(e) =>
                                        setToCityDraft(e.target.value)
                                    }
                                    onBlur={() =>
                                        go('contract-routes', {
                                            to_city: toCityDraft,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Contract status</Label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) =>
                                        go('contract-routes', { status: value })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All statuses
                                        </SelectItem>
                                        <SelectItem value="ACTIVE">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="DRAFT">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="EXPIRED">
                                            Expired
                                        </SelectItem>
                                        <SelectItem value="CANCELLED">
                                            Cancelled
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                    Showing{' '}
                                    <strong className="text-foreground">
                                        {routeRows.length}
                                    </strong>{' '}
                                    route tariff
                                    {routeRows.length === 1 ? '' : 's'}
                                </span>
                                <span className="text-muted-foreground/40">
                                    |
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                    <Info className="h-3 w-3" />
                                    Agreed tariffs are contract unit rates, not
                                    realized revenue.
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasActiveFiltersD ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetFiltersD}
                                    >
                                        <RotateCcw className="h-3 w-3" /> Reset
                                        filters
                                    </Button>
                                ) : null}
                                <Button
                                    asChild
                                    size="sm"
                                    disabled={routeRows.length === 0}
                                >
                                    <a href={exportHref()}>
                                        <Download className="h-3.5 w-3.5" />{' '}
                                        Export CSV
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Contract #
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            From
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            To
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Vehicle type
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Price (SAR)
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {routeRows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                No route tariffs found matching
                                                the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        routeRows.map((row) => (
                                            <tr
                                                key={row.route_id}
                                                data-test="report-route-row"
                                            >
                                                <td className="px-4 py-3 font-mono font-medium">
                                                    {row.contract_number}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.customer_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.from_city}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.to_city}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                                                        {row.vehicle_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-medium">
                                                    {row.price.toLocaleString(
                                                        'en-US',
                                                        {
                                                            minimumFractionDigits: 2,
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            statusVariant[
                                                                row
                                                                    .contract_status
                                                            ]
                                                        }
                                                    >
                                                        {row.contract_status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}

function CustomerContractsTable({
    rows,
}: {
    rows: CustomerContractsReportRow[];
    companySlug: string;
}) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3 font-medium">Contract #</th>
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Contract date</th>
                        <th className="px-4 py-3 font-medium">Expiry date</th>
                        <th className="px-4 py-3 font-medium">Routes</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="py-8 text-center text-muted-foreground"
                            >
                                No contracts match the selected filters.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={row.contract_id}
                                data-test="report-contract-row"
                            >
                                <td className="px-4 py-3 font-mono font-medium">
                                    {row.contract_number}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">
                                        {row.customer_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        CR: {row.customer_cr_number}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {row.contract_date}
                                </td>
                                <td className="px-4 py-3">{row.expiry_date}</td>
                                <td className="px-4 py-3">
                                    {row.routes_count} route
                                    {row.routes_count === 1 ? '' : 's'}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={statusVariant[row.status]}>
                                        {row.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

ReportsIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Reports',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
