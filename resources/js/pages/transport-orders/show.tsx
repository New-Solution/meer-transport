import { Head, Link, router } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import {
    cancel,
    confirm,
    destroy,
    edit,
    index,
} from '@/routes/transport-orders';
import type { Company, TransportOrderDetail } from '@/types';

type Props = {
    order: TransportOrderDetail;
    currentCompany: Company;
};

const statusVariant: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    DRAFT: 'secondary',
    CONFIRMED: 'default',
    CANCELLED: 'destructive',
};

function formatSar(amount: number) {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function TransportOrderShow({ order, currentCompany }: Props) {
    const companySlug = currentCompany.slug;
    const { can } = usePermissions();
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reason, setReason] = useState('');

    const doConfirm = () => {
        router.patch(
            confirm({
                current_company: companySlug,
                transport_order: order.id,
            }),
        );
    };

    const doCancel = () => {
        router.patch(
            cancel({ current_company: companySlug, transport_order: order.id }),
            { reason },
            { onSuccess: () => setCancelOpen(false) },
        );
    };

    const doDelete = () => {
        router.delete(
            destroy({
                current_company: companySlug,
                transport_order: order.id,
            }),
        );
    };

    return (
        <>
            <Head title={`Order ${order.order_number}`} />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title={order.order_number}
                        description={`Customer: ${order.customer_snapshot.name} · Contract: ${order.contract_snapshot.contract_number}`}
                    />

                    <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[order.status]}>
                            {order.status}
                        </Badge>

                        {order.status === 'DRAFT' ? (
                            <>
                                {can('orders:edit') ? (
                                    <Button variant="secondary" asChild>
                                        <Link
                                            href={edit({
                                                current_company: companySlug,
                                                transport_order: order.id,
                                            })}
                                        >
                                            <Pencil className="h-4 w-4" /> Edit
                                        </Link>
                                    </Button>
                                ) : null}
                                {can('orders:edit') ? (
                                    <Button onClick={doConfirm}>Confirm</Button>
                                ) : null}
                                {can('orders:delete') ? (
                                    <Button
                                        variant="destructive"
                                        onClick={doDelete}
                                    >
                                        Delete
                                    </Button>
                                ) : null}
                            </>
                        ) : null}

                        {order.status !== 'CANCELLED' &&
                        can('orders:cancel') ? (
                            <Button
                                variant="destructive"
                                onClick={() => setCancelOpen(true)}
                            >
                                Cancel order
                            </Button>
                        ) : null}
                    </div>
                </div>

                {order.status === 'CANCELLED' ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
                        Cancelled {order.cancelled_at} by {order.cancelled_by}.
                        Reason: {order.cancellation_reason}
                    </div>
                ) : null}

                {order.price_overridden ? (
                    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
                        Price overridden by {order.override_authorized_by} on{' '}
                        {order.override_authorized_at}. Reason:{' '}
                        {order.override_reason}
                    </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Order date
                        </div>
                        <div>{order.order_date}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Required delivery
                        </div>
                        <div>{order.required_delivery_date}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Route
                        </div>
                        <div>
                            {order.route_snapshot.from_city} &rarr;{' '}
                            {order.route_snapshot.to_city}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Total amount
                        </div>
                        <div className="font-medium">
                            SAR {formatSar(order.total_amount)}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Heading variant="small" title="Additional charges" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {order.additional_charges
                            .filter((charge) => charge.enabled)
                            .map((charge) => (
                                <div
                                    key={charge.type}
                                    className="rounded-md border p-3 text-sm"
                                >
                                    <div className="font-medium">
                                        {charge.label}
                                    </div>
                                    <div>
                                        SAR {formatSar(charge.applied_price)}
                                    </div>
                                </div>
                            ))}
                        {order.additional_charges.every(
                            (charge) => !charge.enabled,
                        ) ? (
                            <p className="text-sm text-muted-foreground">
                                None enabled
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-3">
                    <Heading variant="small" title="Trips" />

                    {order.trips.map((trip) => (
                        <div
                            key={trip.id}
                            data-test="order-trip-detail"
                            className="flex items-center justify-between rounded-lg border p-4"
                        >
                            <div>
                                <div className="flex items-center gap-2 font-medium">
                                    {trip.trip_number}
                                    <Badge variant={statusVariant[trip.status]}>
                                        {trip.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {trip.from_city} &rarr; {trip.to_city}{' '}
                                    &middot; Pickup {trip.planned_pickup_date}{' '}
                                    &middot; Delivery{' '}
                                    {trip.planned_delivery_date}
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                <div>
                                    {trip.truck_plate ?? 'No truck assigned'}
                                </div>
                                <div>
                                    {trip.driver_name ?? 'No driver assigned'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel transport order</DialogTitle>
                        <DialogDescription>
                            A cancellation reason is required and cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Keep order</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={doCancel}
                            disabled={!reason.trim()}
                        >
                            Cancel order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

TransportOrderShow.layout = (props: { currentCompany?: Company | null }) => ({
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
