import { Head, Link, router } from '@inertiajs/react';
import {
    Ban,
    Calendar,
    CheckCircle,
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { ContractStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import {
    activate,
    create,
    destroy,
    edit,
    index,
    cancel as cancelContract,
    show,
} from '@/routes/contracts';
import type { Company, ContractListItem } from '@/types';

type CustomerOption = { id: number; name: string };

type Props = {
    contracts: ContractListItem[];
    customers: CustomerOption[];
    filters: { search: string; status: string; customerId: number | null };
    currentCompany: Company;
};

type ConfirmAction = {
    type: 'activate' | 'cancel' | 'delete';
    contract: ContractListItem;
};

export default function ContractsIndex({
    contracts,
    customers,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;
    const { can } = usePermissions();
    const [search, setSearch] = useState(filters.search);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
        null,
    );
    const [cancelReason, setCancelReason] = useState('');

    const applyFilters = (
        next: Partial<{
            search: string;
            status: string;
            customerId: number | null;
        }>,
    ) => {
        router.get(
            index({ current_company: companySlug }),
            {
                search: next.search ?? search,
                status: next.status ?? filters.status,
                customer_id:
                    'customerId' in next ? next.customerId : filters.customerId,
            },
            { preserveState: true, replace: true },
        );
    };

    const hasActiveFilters =
        search !== '' || filters.status !== '' || filters.customerId !== null;

    const resetFilters = () => {
        setSearch('');
        router.get(
            index({ current_company: companySlug }),
            {},
            { preserveState: true, replace: true },
        );
    };

    const closeConfirm = () => {
        setConfirmAction(null);
        setCancelReason('');
    };

    const doActivate = (contract: ContractListItem) => {
        router.patch(
            activate({ current_company: companySlug, contract: contract.id }),
            {},
            { onSuccess: closeConfirm },
        );
    };

    const doDelete = (contract: ContractListItem) => {
        router.delete(
            destroy({ current_company: companySlug, contract: contract.id }),
            { onSuccess: closeConfirm },
        );
    };

    const doCancel = (contract: ContractListItem) => {
        router.patch(
            cancelContract({
                current_company: companySlug,
                contract: contract.id,
            }),
            { reason: cancelReason },
            { onSuccess: closeConfirm },
        );
    };

    return (
        <>
            <Head title="Contracts" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Contracts"
                        description="Manage customer transportation contracts and agreed route pricing."
                    />

                    {can('contracts:create') ? (
                        <Button asChild data-test="contracts-new-button">
                            <Link
                                href={create({
                                    current_company: companySlug,
                                })}
                            >
                                <Plus className="h-4 w-4" /> Create Contract
                            </Link>
                        </Button>
                    ) : null}
                </div>

                <div className="rounded-xl border">
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({ search: e.target.value });
                                }}
                                placeholder="Search by Contract # or Customer Name..."
                                className="pl-9"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Customer:
                                </span>
                                <Select
                                    value={
                                        filters.customerId
                                            ? String(filters.customerId)
                                            : 'ALL'
                                    }
                                    onValueChange={(value) =>
                                        applyFilters({
                                            customerId:
                                                value === 'ALL'
                                                    ? null
                                                    : Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-8 w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All Customers
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

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Status:
                                </span>
                                <Select
                                    value={filters.status || 'ALL'}
                                    onValueChange={(value) =>
                                        applyFilters({
                                            status:
                                                value === 'ALL' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-8 w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All Statuses
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

                            {hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-1 text-xs text-primary hover:underline"
                                >
                                    Reset
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {contracts.length === 0 ? (
                            <p className="py-16 text-center text-sm text-muted-foreground">
                                No contracts match the current filters.
                            </p>
                        ) : (
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold">
                                            Contract Number
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Customer Name
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Contract Date
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Expiry Date
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold">
                                            Routes
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {contracts.map((contract) => (
                                        <tr
                                            key={contract.id}
                                            data-test="contract-row"
                                            className="hover:bg-muted/40"
                                        >
                                            <td className="px-4 py-3.5">
                                                <Link
                                                    href={show({
                                                        current_company:
                                                            companySlug,
                                                        contract: contract.id,
                                                    })}
                                                    className="font-mono font-bold hover:text-primary"
                                                >
                                                    {contract.contract_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium">
                                                    {contract.customer_name}
                                                </div>
                                                <div className="font-mono text-[11px] text-muted-foreground">
                                                    CR:{' '}
                                                    {
                                                        contract.customer_cr_number
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {contract.contract_date}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground">
                                                {contract.expiry_date}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                    {contract.routes_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <ContractStatusBadge
                                                    status={contract.status}
                                                />
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <Link
                                                        href={show({
                                                            current_company:
                                                                companySlug,
                                                            contract:
                                                                contract.id,
                                                        })}
                                                        title="View Contract Details"
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Link>

                                                    {contract.status ===
                                                    'DRAFT' ? (
                                                        <>
                                                            {can(
                                                                'contracts:edit',
                                                            ) ? (
                                                                <Link
                                                                    href={edit({
                                                                        current_company:
                                                                            companySlug,
                                                                        contract:
                                                                            contract.id,
                                                                    })}
                                                                    title="Edit Draft"
                                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Link>
                                                            ) : null}
                                                            {can(
                                                                'contracts:edit',
                                                            ) ? (
                                                                <button
                                                                    type="button"
                                                                    title="Activate Contract"
                                                                    onClick={() =>
                                                                        setConfirmAction(
                                                                            {
                                                                                type: 'activate',
                                                                                contract,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-400"
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                </button>
                                                            ) : null}
                                                            {can(
                                                                'contracts:delete',
                                                            ) ? (
                                                                <button
                                                                    type="button"
                                                                    title="Delete Draft"
                                                                    onClick={() =>
                                                                        setConfirmAction(
                                                                            {
                                                                                type: 'delete',
                                                                                contract,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            ) : null}
                                                        </>
                                                    ) : null}

                                                    {contract.status ===
                                                    'ACTIVE' ? (
                                                        <>
                                                            {can(
                                                                'contracts:edit',
                                                            ) ? (
                                                                <Link
                                                                    href={edit({
                                                                        current_company:
                                                                            companySlug,
                                                                        contract:
                                                                            contract.id,
                                                                    })}
                                                                    title="Edit Contract & Routes"
                                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Link>
                                                            ) : null}
                                                            {can(
                                                                'contracts:edit',
                                                            ) ? (
                                                                <button
                                                                    type="button"
                                                                    title="Cancel Contract (Preserve History)"
                                                                    onClick={() =>
                                                                        setConfirmAction(
                                                                            {
                                                                                type: 'cancel',
                                                                                contract,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/60 dark:hover:text-amber-400"
                                                                >
                                                                    <Ban className="h-3.5 w-3.5" />
                                                                </button>
                                                            ) : null}
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {contracts.length > 0 ? (
                        <div className="border-t p-4 text-xs text-muted-foreground">
                            Showing{' '}
                            <span className="font-semibold text-foreground">
                                {contracts.length}
                            </span>{' '}
                            contract{contracts.length === 1 ? '' : 's'}
                        </div>
                    ) : null}
                </div>
            </div>

            <Dialog
                open={confirmAction?.type === 'activate'}
                onOpenChange={(open) => !open && closeConfirm()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activate Contract</DialogTitle>
                        <DialogDescription>
                            Activating{' '}
                            <strong>
                                {confirmAction?.contract.contract_number}
                            </strong>{' '}
                            makes its agreed route tariffs available for new
                            transport orders within its validity period.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={() =>
                                confirmAction &&
                                doActivate(confirmAction.contract)
                            }
                        >
                            Confirm Activation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={confirmAction?.type === 'delete'}
                onOpenChange={(open) => !open && closeConfirm()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Draft Contract</DialogTitle>
                        <DialogDescription>
                            Permanently delete draft contract{' '}
                            <strong>
                                {confirmAction?.contract.contract_number}
                            </strong>{' '}
                            and its uncommitted routes. Customer records will
                            not be affected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                confirmAction &&
                                doDelete(confirmAction.contract)
                            }
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Draft
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={confirmAction?.type === 'cancel'}
                onOpenChange={(open) => !open && closeConfirm()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Active Contract</DialogTitle>
                        <DialogDescription>
                            Active contracts cannot be permanently deleted.
                            Cancelling{' '}
                            <strong>
                                {confirmAction?.contract.contract_number}
                            </strong>{' '}
                            prevents new transport orders while preserving all
                            agreed routes and pricing for historical reference.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="cancel-reason">
                            Reason for cancellation (optional)
                        </Label>
                        <Textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g. Mutual client termination, revised agreement superseded..."
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Back</Button>
                        </DialogClose>
                        <Button
                            onClick={() =>
                                confirmAction &&
                                doCancel(confirmAction.contract)
                            }
                        >
                            <Ban className="h-3.5 w-3.5" /> Confirm Cancellation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ContractsIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Contracts',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
