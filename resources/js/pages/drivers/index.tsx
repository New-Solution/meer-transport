import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteDriverModal from '@/components/drivers/delete-driver-modal';
import DriverFormModal from '@/components/drivers/driver-form-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { index } from '@/routes/drivers';
import type { Company, Driver } from '@/types';

type Props = {
    drivers: Driver[];
    filters: { search: string };
    currentCompany: Company;
};

function expiryBadge(dateStr: string | null) {
    if (!dateStr) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    const diffDays = Math.round(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
        return <Badge variant="destructive">Expired</Badge>;
    }
    if (diffDays <= 30) {
        return <Badge variant="outline">Expires in {diffDays}d</Badge>;
    }
    return null;
}

export default function DriversIndex({
    drivers,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;

    const [search, setSearch] = useState(filters.search);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Driver | null>(null);

    const applySearch = (value: string) => {
        setSearch(value);
        router.get(
            index({ current_company: companySlug }),
            { search: value },
            { preserveState: true, replace: true },
        );
    };

    const openDelete = (driver: Driver) => {
        setDeleting(driver);
        setDeleteOpen(true);
    };

    return (
        <>
            <Head title="Drivers" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Drivers"
                        description="Drivers who can be assigned to transport trips"
                    />

                    <DriverFormModal companySlug={companySlug}>
                        <Button data-test="drivers-new-button">
                            <Plus /> New driver
                        </Button>
                    </DriverFormModal>
                </div>

                <Input
                    value={search}
                    onChange={(e) => applySearch(e.target.value)}
                    placeholder="Search by name, license, ID or phone"
                    className="max-w-sm"
                />

                <div className="space-y-3">
                    {drivers.map((driver) => (
                        <div
                            key={driver.id}
                            data-test="driver-row"
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {driver.first_name} {driver.last_name}
                                    </span>
                                    {expiryBadge(driver.license_expiry)}
                                    {expiryBadge(driver.id_iqama_expiry)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {[
                                        driver.nationality,
                                        driver.home_city,
                                        driver.mobile_phone_1,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <DriverFormModal
                                    companySlug={companySlug}
                                    driver={driver}
                                >
                                    <Button variant="ghost" size="sm">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DriverFormModal>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDelete(driver)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {drivers.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No drivers yet. Add your first one above.
                        </p>
                    ) : null}
                </div>
            </div>

            <DeleteDriverModal
                companySlug={companySlug}
                driver={deleting}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    );
}

DriversIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Drivers',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
