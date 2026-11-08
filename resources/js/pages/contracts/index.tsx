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
import { create, index, show } from '@/routes/contracts';
import type { Company, ContractListItem } from '@/types';

type Props = {
    contracts: ContractListItem[];
    filters: { search: string; status: string; customerId: number | null };
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

export default function ContractsIndex({
    contracts,
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
            <Head title="Contracts" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Contracts"
                        description="Customer agreements with multi-route tariffs"
                    />

                    <Button asChild data-test="contracts-new-button">
                        <Link href={create({ current_company: companySlug })}>
                            <Plus /> New contract
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
                        placeholder="Search by contract number or customer"
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
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    {contracts.map((contract) => (
                        <Link
                            key={contract.id}
                            data-test="contract-row"
                            href={show({
                                current_company: companySlug,
                                contract: contract.id,
                            })}
                            className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-accent"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {contract.contract_number}
                                    </span>
                                    <Badge
                                        variant={statusVariant[contract.status]}
                                    >
                                        {contract.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {contract.customer_name} &middot;{' '}
                                    {contract.routes_count} route
                                    {contract.routes_count === 1 ? '' : 's'}
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                <div>{contract.contract_date}</div>
                                <div>to {contract.expiry_date}</div>
                            </div>
                        </Link>
                    ))}

                    {contracts.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No contracts yet. Create your first one above.
                        </p>
                    ) : null}
                </div>
            </div>
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
