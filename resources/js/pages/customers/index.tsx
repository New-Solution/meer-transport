import { Head, router } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import CustomerFormModal from '@/components/customers/customer-form-modal';
import DeleteCustomerModal from '@/components/customers/delete-customer-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import { archive, index, restore } from '@/routes/customers';
import type { Company, Customer } from '@/types';

type Props = {
    customers: Customer[];
    filters: { search: string; includeArchived: boolean };
    currentCompany: Company;
};

export default function CustomersIndex({
    customers,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;

    const [search, setSearch] = useState(filters.search);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Customer | null>(null);

    const applyFilters = (next: Partial<typeof filters>) => {
        router.get(
            index({ current_company: companySlug }),
            {
                search: next.search ?? search,
                include_archived:
                    next.includeArchived ?? filters.includeArchived,
            },
            { preserveState: true, replace: true },
        );
    };

    const openDelete = (customer: Customer) => {
        setDeleting(customer);
        setDeleteOpen(true);
    };

    const toggleArchive = (customer: Customer) => {
        const action = customer.archived_at
            ? restore({ current_company: companySlug, customer: customer.id })
            : archive({ current_company: companySlug, customer: customer.id });

        router.patch(action);
    };

    return (
        <>
            <Head title="Customers" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Customers"
                        description="Manage transportation customers and company information."
                    />

                    <CustomerFormModal companySlug={companySlug}>
                        <Button data-test="customers-new-button">
                            <Plus className="h-4 w-4" /> Add Customer
                        </Button>
                    </CustomerFormModal>
                </div>

                <div className="rounded-xl border">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({ search: e.target.value });
                                }}
                                placeholder="Search by Name, CR, Unified, or VAT Number..."
                                className="pl-9"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="include-archived"
                                    checked={filters.includeArchived}
                                    onCheckedChange={(checked) =>
                                        applyFilters({
                                            includeArchived: Boolean(checked),
                                        })
                                    }
                                />
                                <Label
                                    htmlFor="include-archived"
                                    className="font-normal text-muted-foreground"
                                >
                                    Show archived
                                </Label>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Total:{' '}
                                <strong className="font-mono text-foreground">
                                    {customers.length}
                                </strong>
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {customers.length === 0 ? (
                            <p className="py-16 text-center text-sm text-muted-foreground">
                                No customer record matches the current search.
                            </p>
                        ) : (
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold">
                                            Customer Name
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            CR Number
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Unified Number
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            VAT Number
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Address
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {customers.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            data-test="customer-row"
                                            className="hover:bg-muted/40"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2 font-semibold">
                                                    {customer.name}
                                                    {customer.archived_at ? (
                                                        <Badge variant="secondary">
                                                            Archived
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-muted-foreground">
                                                {customer.cr_number}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-muted-foreground">
                                                {customer.unified_number}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-muted-foreground">
                                                {customer.vat_number}
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3.5 text-muted-foreground">
                                                {customer.address}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <CustomerFormModal
                                                        companySlug={
                                                            companySlug
                                                        }
                                                        customer={customer}
                                                    >
                                                        <button
                                                            type="button"
                                                            title="Edit Customer"
                                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </CustomerFormModal>

                                                    <button
                                                        type="button"
                                                        title={
                                                            customer.archived_at
                                                                ? 'Restore Customer'
                                                                : 'Archive Customer'
                                                        }
                                                        onClick={() =>
                                                            toggleArchive(
                                                                customer,
                                                            )
                                                        }
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/60 dark:hover:text-amber-400"
                                                    >
                                                        {customer.archived_at ? (
                                                            <ArchiveRestore className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Archive className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Delete Customer"
                                                        onClick={() =>
                                                            openDelete(customer)
                                                        }
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <DeleteCustomerModal
                companySlug={companySlug}
                customer={deleting}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    );
}

CustomersIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Customers',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
