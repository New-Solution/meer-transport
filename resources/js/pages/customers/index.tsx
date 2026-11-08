import { Head, router } from '@inertiajs/react';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
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
                <div className="flex items-center justify-between">
                    <Heading
                        title="Customers"
                        description="Companies you ship for under contract"
                    />

                    <CustomerFormModal companySlug={companySlug}>
                        <Button data-test="customers-new-button">
                            <Plus /> New customer
                        </Button>
                    </CustomerFormModal>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters({ search: e.target.value });
                        }}
                        placeholder="Search by name, CR, unified or VAT number"
                        className="max-w-sm"
                    />

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
                            className="font-normal"
                        >
                            Show archived
                        </Label>
                    </div>
                </div>

                <div className="space-y-3">
                    {customers.map((customer) => (
                        <div
                            key={customer.id}
                            data-test="customer-row"
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {customer.name}
                                    </span>
                                    {customer.archived_at ? (
                                        <Badge variant="secondary">
                                            Archived
                                        </Badge>
                                    ) : null}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    CR {customer.cr_number} &middot; Unified{' '}
                                    {customer.unified_number} &middot; VAT{' '}
                                    {customer.vat_number}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <CustomerFormModal
                                    companySlug={companySlug}
                                    customer={customer}
                                >
                                    <Button variant="ghost" size="sm">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </CustomerFormModal>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleArchive(customer)}
                                >
                                    {customer.archived_at ? (
                                        <ArchiveRestore className="h-4 w-4" />
                                    ) : (
                                        <Archive className="h-4 w-4" />
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDelete(customer)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {customers.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No customers yet. Create your first one above.
                        </p>
                    ) : null}
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
