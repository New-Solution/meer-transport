import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Ban,
    CheckCircle2,
    Clock,
    FileEdit,
    FileText,
    Plus,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import PendingInvitationsModal from '@/components/pending-invitations-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import {
    create,
    index as contractsIndex,
    show as showContract,
} from '@/routes/contracts';
import type {
    Company,
    DashboardContractSummary,
    DashboardInvitation,
    DashboardMetrics,
    DashboardUpcomingExpiration,
} from '@/types';

type Props = {
    pendingInvitations?: DashboardInvitation[];
    metrics: DashboardMetrics;
    recentContracts: DashboardContractSummary[];
    upcomingExpirations: DashboardUpcomingExpiration[];
    canCreateContract: boolean;
    currentCompany?: Company;
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

export default function Dashboard({
    pendingInvitations = [],
    metrics,
    recentContracts,
    upcomingExpirations,
    canCreateContract,
    currentCompany,
}: Props) {
    const [showInvitations, setShowInvitations] = useState(
        pendingInvitations.length > 0,
    );

    const companySlug = currentCompany?.slug;
    const total = metrics.totalContracts || 1;
    const pctActive = Math.round((metrics.activeContracts / total) * 100);
    const pctDraft = Math.round((metrics.draftContracts / total) * 100);
    const pctExpired = Math.round((metrics.expiredContracts / total) * 100);
    const pctCancelled = Math.round((metrics.cancelledContracts / total) * 100);

    return (
        <>
            <Head title="Dashboard" />
            <PendingInvitationsModal
                invitations={pendingInvitations}
                open={pendingInvitations.length > 0 && showInvitations}
                onOpenChange={setShowInvitations}
            />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                            Truck Transportation Overview
                        </h2>
                        <p className="mt-1 max-w-xl text-sm text-slate-300">
                            {currentCompany
                                ? `Live business dashboard for ${currentCompany.name}.`
                                : 'Live business dashboard.'}
                        </p>
                    </div>

                    {canCreateContract && companySlug ? (
                        <Button asChild className="shrink-0">
                            <Link
                                href={create({ current_company: companySlug })}
                            >
                                <Plus className="h-4 w-4" /> Create contract
                            </Link>
                        </Button>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Total Customers
                                </span>
                                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-bold">
                                {metrics.totalCustomers}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Active verified accounts
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Total Contracts
                                </span>
                                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    <FileText className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-bold">
                                {metrics.totalContracts}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Agreements with route tariffs
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Active Contracts
                                </span>
                                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {metrics.activeContracts}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Eligible for transport orders
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Expired Contracts
                                </span>
                                <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {metrics.expiredContracts}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Past validity cutoff
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Contract Status Summary</CardTitle>
                            <CardDescription>
                                Distribution of contracts across the four
                                lifecycle statuses
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>
                                Total: {metrics.totalContracts} contracts
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                            {metrics.totalContracts > 0 ? (
                                <>
                                    <div
                                        style={{ width: `${pctActive}%` }}
                                        className="bg-emerald-500"
                                        title={`Active: ${metrics.activeContracts}`}
                                    />
                                    <div
                                        style={{ width: `${pctDraft}%` }}
                                        className="bg-amber-400"
                                        title={`Draft: ${metrics.draftContracts}`}
                                    />
                                    <div
                                        style={{ width: `${pctExpired}%` }}
                                        className="bg-rose-500"
                                        title={`Expired: ${metrics.expiredContracts}`}
                                    />
                                    <div
                                        style={{ width: `${pctCancelled}%` }}
                                        className="bg-slate-400 dark:bg-slate-500"
                                        title={`Cancelled: ${metrics.cancelledContracts}`}
                                    />
                                </>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-950/60 dark:bg-emerald-950/20">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                    Active
                                </div>
                                <div className="mt-1 flex items-baseline justify-between">
                                    <span className="text-xl font-bold">
                                        {metrics.activeContracts}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {pctActive}%
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-950/60 dark:bg-amber-950/20">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    <FileEdit className="h-3.5 w-3.5" /> Draft
                                </div>
                                <div className="mt-1 flex items-baseline justify-between">
                                    <span className="text-xl font-bold">
                                        {metrics.draftContracts}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {pctDraft}%
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-950/60 dark:bg-rose-950/20">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                                    <AlertCircle className="h-3.5 w-3.5" />{' '}
                                    Expired
                                </div>
                                <div className="mt-1 flex items-baseline justify-between">
                                    <span className="text-xl font-bold">
                                        {metrics.expiredContracts}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {pctExpired}%
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/40 p-3">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                    <Ban className="h-3.5 w-3.5" /> Cancelled
                                </div>
                                <div className="mt-1 flex items-baseline justify-between">
                                    <span className="text-xl font-bold">
                                        {metrics.cancelledContracts}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {pctCancelled}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Upcoming Expirations</CardTitle>
                            <CardDescription>
                                Active contracts expiring within the next 30
                                days
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                                {upcomingExpirations.length} contract(s)
                                requiring renewal
                            </span>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        {upcomingExpirations.length === 0 ? (
                            <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
                                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                                <p className="font-semibold text-foreground">
                                    All active contracts valid
                                </p>
                                <p className="mt-0.5">
                                    No active contracts are scheduled to expire
                                    within the next 30 days.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-amber-50/50 text-muted-foreground dark:bg-amber-950/20">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">
                                            Contract #
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Expiry date
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Days remaining
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Routes
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {upcomingExpirations.map((contract) => (
                                        <tr
                                            key={contract.id}
                                            data-test="upcoming-expiration-row"
                                        >
                                            <td className="px-6 py-3 font-mono font-semibold">
                                                {contract.contract_number}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-medium">
                                                    {contract.customer_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    CR:{' '}
                                                    {
                                                        contract.customer_cr_number
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                {contract.expiry_date}
                                            </td>
                                            <td className="px-6 py-3">
                                                {contract.days_remaining ===
                                                0 ? (
                                                    <Badge variant="destructive">
                                                        Expires today
                                                    </Badge>
                                                ) : contract.days_remaining <=
                                                  7 ? (
                                                    <Badge variant="destructive">
                                                        {
                                                            contract.days_remaining
                                                        }{' '}
                                                        day
                                                        {contract.days_remaining ===
                                                        1
                                                            ? ''
                                                            : 's'}{' '}
                                                        left
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        {
                                                            contract.days_remaining
                                                        }{' '}
                                                        days left
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                {contract.routes_count} route
                                                {contract.routes_count === 1
                                                    ? ''
                                                    : 's'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {companySlug ? (
                                                    <Link
                                                        href={showContract({
                                                            current_company:
                                                                companySlug,
                                                            contract:
                                                                contract.id,
                                                        })}
                                                        className="text-sm font-medium text-primary hover:underline"
                                                    >
                                                        View contract
                                                    </Link>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Recent Transport Contracts</CardTitle>
                            <CardDescription>
                                The most recently dated contracts for this
                                company
                            </CardDescription>
                        </div>
                        {companySlug ? (
                            <Link
                                href={contractsIndex({
                                    current_company: companySlug,
                                })}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                View all contracts
                            </Link>
                        ) : null}
                    </CardHeader>
                    <div className="overflow-x-auto">
                        {recentContracts.length === 0 ? (
                            <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
                                No contracts recorded yet. Start by creating
                                your first customer and contract.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">
                                            Contract #
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Contract date
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Expiry date
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Routes
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {recentContracts.map((contract) => (
                                        <tr
                                            key={contract.id}
                                            data-test="recent-contract-row"
                                        >
                                            <td className="px-6 py-3 font-mono font-semibold">
                                                {contract.contract_number}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-medium">
                                                    {contract.customer_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    CR:{' '}
                                                    {
                                                        contract.customer_cr_number
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                {contract.contract_date}
                                            </td>
                                            <td className="px-6 py-3">
                                                {contract.expiry_date}
                                            </td>
                                            <td className="px-6 py-3">
                                                {contract.routes_count} route
                                                {contract.routes_count === 1
                                                    ? ''
                                                    : 's'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Badge
                                                    variant={
                                                        statusVariant[
                                                            contract.status
                                                        ]
                                                    }
                                                >
                                                    {contract.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {companySlug ? (
                                                    <Link
                                                        href={showContract({
                                                            current_company:
                                                                companySlug,
                                                            contract:
                                                                contract.id,
                                                        })}
                                                        className="text-sm font-medium text-primary hover:underline"
                                                    >
                                                        View contract
                                                    </Link>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
    ],
});
