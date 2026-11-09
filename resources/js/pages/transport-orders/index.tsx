import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { OrderStatusBadge } from '@/components/status-badge';
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
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import {
    cancel,
    create,
    destroy,
    edit,
    index,
    confirm as confirmOrder,
    show,
} from '@/routes/transport-orders';
import type { Company, TransportOrderListItem } from '@/types';

type CustomerOption = { id: number; name: string };

type Filters = {
    search: string;
    status: string;
    customerId: number | null;
    fromDate: string;
    toDate: string;
};

type Props = {
    orders: TransportOrderListItem[];
    customers: CustomerOption[];
    filters: Filters;
    currentCompany: Company;
};

type ConfirmAction = {
    type: 'confirm' | 'cancel' | 'delete';
    order: TransportOrderListItem;
};

function money(value: number) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function TransportOrdersIndex({
    orders,
    customers,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;
    const { can } = usePermissions();
    const [search, setSearch] = useState(filters.search);
    const [action, setAction] = useState<ConfirmAction | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            index({ current_company: companySlug }),
            {
                search: next.search ?? search,
                status: next.status ?? filters.status,
                customer_id:
                    'customerId' in next ? next.customerId : filters.customerId,
                from_date: next.fromDate ?? filters.fromDate,
                to_date: next.toDate ?? filters.toDate,
            },
            { preserveState: true, replace: true },
        );
    };

    const hasActiveFilters =
        search !== '' ||
        filters.status !== '' ||
        filters.customerId !== null ||
        filters.fromDate !== '' ||
        filters.toDate !== '';

    const resetFilters = () => {
        setSearch('');
        router.get(
            index({ current_company: companySlug }),
            {},
            { preserveState: true, replace: true },
        );
    };

    const closeAction = () => {
        setAction(null);
        setCancelReason('');
    };

    const doConfirm = (order: TransportOrderListItem) => {
        router.patch(
            confirmOrder({
                current_company: companySlug,
                transport_order: order.id,
            }),
            {},
            { onSuccess: closeAction },
        );
    };

    const doDelete = (order: TransportOrderListItem) => {
        router.delete(
            destroy({
                current_company: companySlug,
                transport_order: order.id,
            }),
            { onSuccess: closeAction },
        );
    };

    const doCancel = (order: TransportOrderListItem) => {
        router.patch(
            cancel({ current_company: companySlug, transport_order: order.id }),
            { reason: cancelReason },
            { onSuccess: closeAction },
        );
    };

    return (
        <>
            <Head title="Transport Orders" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Transport Orders"
                        description="Manage multi-trip execution orders linked to approved customer contracts and routes."
                    />

                    {can('orders:create') ? (
                        <Button asChild data-test="orders-new-button">
                            <Link
                                href={create({
                                    current_company: companySlug,
                                })}
                            >
                                <Plus className="h-4 w-4" /> New Transport Order
                            </Link>
                        </Button>
                    ) : null}
                </div>

                <div className="space-y-3 rounded-xl border p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="grid gap-1 lg:col-span-2">
                            <Label className="text-xs text-muted-foreground">
                                Search
                            </Label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        applyFilters({
                                            search: e.target.value,
                                        });
                                    }}
                                    placeholder="Order #, Customer, or PO..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">
                                Status
                            </Label>
                            <Select
                                value={filters.status || 'ALL'}
                                onValueChange={(value) =>
                                    applyFilters({
                                        status: value === 'ALL' ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        All Statuses
                                    </SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="CONFIRMED">
                                        Confirmed
                                    </SelectItem>
                                    <SelectItem value="CANCELLED">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">
                                Customer
                            </Label>
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
                                <SelectTrigger>
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

                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">
                                From Date
                            </Label>
                            <Input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) =>
                                    applyFilters({ fromDate: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">
                                To Date:
                            </Label>
                            <Input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) =>
                                    applyFilters({ toDate: e.target.value })
                                }
                                className="w-auto"
                            />
                        </div>

                        {hasActiveFilters ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                            >
                                <X className="h-3.5 w-3.5" /> Reset Filters
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    {orders.length === 0 ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">
                            No transport orders found matching the current
                            filters.
                        </p>
                    ) : (
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    <th className="px-4 py-3">Order #</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">
                                        Contract Route
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Trips
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Applied Rate
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Total (SAR)
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        data-test="order-row"
                                        className="hover:bg-muted/40"
                                    >
                                        <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">
                                            <Link
                                                href={show({
                                                    current_company:
                                                        companySlug,
                                                    transport_order: order.id,
                                                })}
                                                className="text-primary hover:underline"
                                            >
                                                {order.order_number}
                                            </Link>
                                            {order.customer_po_number ? (
                                                <div className="font-sans text-[10px] text-muted-foreground">
                                                    PO:{' '}
                                                    {order.customer_po_number}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            <div>{order.order_date}</div>
                                            <div className="text-[10px]">
                                                Req:{' '}
                                                {order.required_delivery_date}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="max-w-[180px] truncate font-medium">
                                                {order.customer_name}
                                            </div>
                                            <div className="font-mono text-[10px] text-muted-foreground">
                                                CR: {order.customer_cr_number}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {order.from_city} &rarr;{' '}
                                                {order.to_city}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {order.vehicle_type} | Contract:{' '}
                                                <span className="font-mono">
                                                    {order.contract_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                                                {order.trip_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            <div className="font-semibold">
                                                {money(order.applied_price)}
                                            </div>
                                            {order.price_overridden ? (
                                                <div className="font-sans text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                                    Overridden
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold">
                                            {money(order.total_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <OrderStatusBadge
                                                status={order.status}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1">
                                                <Link
                                                    href={show({
                                                        current_company:
                                                            companySlug,
                                                        transport_order:
                                                            order.id,
                                                    })}
                                                    title="View Order Details"
                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Link>

                                                {order.status === 'DRAFT' ? (
                                                    <>
                                                        {can('orders:edit') ? (
                                                            <Link
                                                                href={edit({
                                                                    current_company:
                                                                        companySlug,
                                                                    transport_order:
                                                                        order.id,
                                                                })}
                                                                title="Edit Draft Order"
                                                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Link>
                                                        ) : null}
                                                        {can('orders:edit') ? (
                                                            <button
                                                                type="button"
                                                                title="Confirm Order"
                                                                onClick={() =>
                                                                    setAction({
                                                                        type: 'confirm',
                                                                        order,
                                                                    })
                                                                }
                                                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-400"
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        ) : null}
                                                        {can(
                                                            'orders:delete',
                                                        ) ? (
                                                            <button
                                                                type="button"
                                                                title="Delete Draft"
                                                                onClick={() =>
                                                                    setAction({
                                                                        type: 'delete',
                                                                        order,
                                                                    })
                                                                }
                                                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        ) : null}
                                                    </>
                                                ) : null}

                                                {order.status === 'CONFIRMED' &&
                                                can('orders:cancel') ? (
                                                    <button
                                                        type="button"
                                                        title="Cancel Confirmed Order"
                                                        onClick={() =>
                                                            setAction({
                                                                type: 'cancel',
                                                                order,
                                                            })
                                                        }
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {orders.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                        Showing{' '}
                        <span className="font-semibold text-foreground">
                            {orders.length}
                        </span>{' '}
                        order{orders.length === 1 ? '' : 's'}
                    </p>
                ) : null}
            </div>

            <Dialog
                open={action?.type === 'confirm'}
                onOpenChange={(open) => !open && closeAction()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Transport Order</DialogTitle>
                        <DialogDescription>
                            Confirming{' '}
                            <strong>{action?.order.order_number}</strong>{' '}
                            permanently freezes the customer, contract, and
                            route snapshots. Order header and pricing cannot be
                            edited after confirmation, and all{' '}
                            {action?.order.trip_count} trip(s) will move to
                            Confirmed status.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={() => action && doConfirm(action.order)}
                        >
                            Yes, Confirm Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={action?.type === 'delete'}
                onOpenChange={(open) => !open && closeAction()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Draft Order</DialogTitle>
                        <DialogDescription>
                            Permanently delete draft order{' '}
                            <strong>{action?.order.order_number}</strong> and
                            all its associated trips?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => action && doDelete(action.order)}
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                            Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={action?.type === 'cancel'}
                onOpenChange={(open) => !open && closeAction()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Transport Order</DialogTitle>
                        <DialogDescription>
                            Cancel <strong>{action?.order.order_number}</strong>
                            ? This cannot be undone. All associated trips will
                            also be marked as cancelled.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="order-cancel-reason">
                            Cancellation reason (required)
                        </Label>
                        <Input
                            id="order-cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g. Customer cancelled shipment, duplicate order..."
                            required
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Back</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            disabled={!cancelReason.trim()}
                            onClick={() => action && doCancel(action.order)}
                        >
                            Confirm Cancellation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

TransportOrdersIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Transport Orders',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
