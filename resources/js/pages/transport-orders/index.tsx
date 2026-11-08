import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import { create, index, show } from '@/routes/transport-orders';
import type { Company, TransportOrderListItem } from '@/types';

type Props = {
    orders: TransportOrderListItem[];
    filters: { search: string; status: string; customerId: number | null };
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

export default function TransportOrdersIndex({
    orders,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (
        next: Partial<{ search: string; status: string }>,
    ) => {
        router.get(
            index({ current_company: companySlug }),
            {
                search: next.search ?? search,
                status: next.status ?? filters.status,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Transport Orders" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Transport Orders"
                        description="Customer shipment orders with trips"
                    />

                    <Button asChild data-test="orders-new-button">
                        <Link href={create({ current_company: companySlug })}>
                            <Plus /> New order
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters({ search: e.target.value });
                        }}
                        placeholder="Search by order number, customer or PO"
                        className="max-w-sm"
                    />

                    <Select
                        value={filters.status || 'ALL'}
                        onValueChange={(value) =>
                            applyFilters({
                                status: value === 'ALL' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All statuses</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    {orders.map((order) => (
                        <Link
                            key={order.id}
                            data-test="order-row"
                            href={show({
                                current_company: companySlug,
                                transport_order: order.id,
                            })}
                            className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-accent"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {order.order_number}
                                    </span>
                                    <Badge
                                        variant={statusVariant[order.status]}
                                    >
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {order.customer_name} &middot;{' '}
                                    {order.trip_count} trip
                                    {order.trip_count === 1 ? '' : 's'}
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                <div>{order.order_date}</div>
                                <div>
                                    SAR{' '}
                                    {order.total_amount.toLocaleString(
                                        'en-US',
                                        {
                                            minimumFractionDigits: 2,
                                        },
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {orders.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No transport orders yet. Create your first one
                            above.
                        </p>
                    ) : null}
                </div>
            </div>
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
