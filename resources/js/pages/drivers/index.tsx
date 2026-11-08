import { Head, router } from '@inertiajs/react';
import { Pencil, Phone, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteDriverModal from '@/components/drivers/delete-driver-modal';
import DriverFormModal from '@/components/drivers/driver-form-modal';
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
import { index } from '@/routes/drivers';
import type { Company, Driver } from '@/types';

type Filters = {
    search: string;
    nationality: string;
    homeCity: string;
    licenseStatus: string;
    idIqamaStatus: string;
};

type Props = {
    drivers: Driver[];
    nationalityOptions: string[];
    homeCityOptions: string[];
    filters: Filters;
    currentCompany: Company;
};

function expiryStatus(dateStr: string | null) {
    if (!dateStr) {
        return { status: 'NONE' as const, days: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const days = Math.round(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (days < 0) {
        return { status: 'EXPIRED' as const, days };
    }
    if (days <= 30) {
        return { status: 'EXPIRING_SOON' as const, days };
    }
    return { status: 'VALID' as const, days };
}

function ExpiryCell({ date }: { date: string | null }) {
    if (!date) {
        return (
            <span className="font-mono text-xs text-muted-foreground">—</span>
        );
    }

    const { status, days } = expiryStatus(date);

    return (
        <div className="flex flex-col gap-0.5">
            <span
                className={
                    status === 'EXPIRED'
                        ? 'font-mono font-semibold text-rose-600 dark:text-rose-400'
                        : 'font-mono'
                }
            >
                {date}
            </span>
            {status === 'VALID' ? (
                <Badge className="w-fit border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Valid
                </Badge>
            ) : status === 'EXPIRING_SOON' ? (
                <Badge className="w-fit border-amber-200 bg-amber-50 text-[10px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                    {days === 0 ? 'Expires today' : `${days}d left`}
                </Badge>
            ) : (
                <Badge className="w-fit border-rose-200 bg-rose-50 text-[10px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400">
                    Expired
                </Badge>
            )}
        </div>
    );
}

export default function DriversIndex({
    drivers,
    nationalityOptions,
    homeCityOptions,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;
    const [search, setSearch] = useState(filters.search);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Driver | null>(null);

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            index({ current_company: companySlug }),
            {
                search: next.search ?? search,
                nationality: next.nationality ?? filters.nationality,
                home_city: next.homeCity ?? filters.homeCity,
                license_status: next.licenseStatus ?? filters.licenseStatus,
                id_iqama_status: next.idIqamaStatus ?? filters.idIqamaStatus,
            },
            { preserveState: true, replace: true },
        );
    };

    const hasActiveFilters =
        search !== '' ||
        filters.nationality !== '' ||
        filters.homeCity !== '' ||
        filters.licenseStatus !== '' ||
        filters.idIqamaStatus !== '';

    const resetFilters = () => {
        setSearch('');
        router.get(
            index({ current_company: companySlug }),
            {},
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Drivers"
                        description="Manage heavy vehicle driver profiles, driving license validities, and Iqama documentation."
                    />

                    <DriverFormModal companySlug={companySlug}>
                        <Button data-test="drivers-new-button">
                            <Plus className="h-4 w-4" /> Add Driver
                        </Button>
                    </DriverFormModal>
                </div>

                <div className="space-y-3 rounded-xl border p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({ search: e.target.value });
                                }}
                                placeholder="Search name, license, ID, mobile..."
                                className="pl-9"
                            />
                        </div>

                        <Select
                            value={filters.nationality || 'ALL'}
                            onValueChange={(value) =>
                                applyFilters({
                                    nationality: value === 'ALL' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">
                                    Nationality: All
                                </SelectItem>
                                {nationalityOptions.map((nat) => (
                                    <SelectItem key={nat} value={nat}>
                                        {nat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.licenseStatus || 'ALL'}
                            onValueChange={(value) =>
                                applyFilters({
                                    licenseStatus: value === 'ALL' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">
                                    License Status: All
                                </SelectItem>
                                <SelectItem value="VALID">
                                    License: Valid
                                </SelectItem>
                                <SelectItem value="EXPIRING_SOON">
                                    License: Expiring Soon (&le;30d)
                                </SelectItem>
                                <SelectItem value="EXPIRED">
                                    License: Expired
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.idIqamaStatus || 'ALL'}
                            onValueChange={(value) =>
                                applyFilters({
                                    idIqamaStatus: value === 'ALL' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">
                                    ID/Iqama Status: All
                                </SelectItem>
                                <SelectItem value="VALID">
                                    ID/Iqama: Valid
                                </SelectItem>
                                <SelectItem value="EXPIRING_SOON">
                                    ID/Iqama: Expiring Soon (&le;30d)
                                </SelectItem>
                                <SelectItem value="EXPIRED">
                                    ID/Iqama: Expired
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.homeCity || 'ALL'}
                            onValueChange={(value) =>
                                applyFilters({
                                    homeCity: value === 'ALL' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">
                                    Home City: All
                                </SelectItem>
                                {homeCityOptions.map((city) => (
                                    <SelectItem key={city} value={city}>
                                        {city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {hasActiveFilters ? (
                        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                            <span>
                                Found {drivers.length} matching{' '}
                                {drivers.length === 1 ? 'driver' : 'drivers'}
                            </span>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                                <RotateCcw className="h-3 w-3" /> Reset all
                                filters
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    {drivers.length === 0 ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">
                            No drivers match the current search and filters.
                        </p>
                    ) : (
                        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    <th className="w-12 px-4 py-3 text-center">
                                        #
                                    </th>
                                    <th className="px-4 py-3">Driver Name</th>
                                    <th className="px-4 py-3">Nationality</th>
                                    <th className="px-4 py-3">License No</th>
                                    <th className="px-4 py-3">
                                        License Expiry
                                    </th>
                                    <th className="px-4 py-3">
                                        Saudi ID / Iqama
                                    </th>
                                    <th className="px-4 py-3">ID Expiry</th>
                                    <th className="px-4 py-3">Mobile 1</th>
                                    <th className="px-4 py-3">Mobile 2</th>
                                    <th className="px-4 py-3">Home</th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {drivers.map((driver, idx) => (
                                    <tr
                                        key={driver.id}
                                        data-test="driver-row"
                                        className="hover:bg-muted/40"
                                    >
                                        <td className="px-4 py-3 text-center font-mono text-[11px] text-muted-foreground">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 font-semibold whitespace-nowrap">
                                            {driver.first_name}{' '}
                                            {driver.last_name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {driver.nationality ? (
                                                <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
                                                    {driver.nationality}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                                            {driver.license_no || (
                                                <span className="font-sans text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <ExpiryCell
                                                date={driver.license_expiry}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">
                                            {driver.saudi_id_iqama_no || (
                                                <span className="font-sans font-normal text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <ExpiryCell
                                                date={driver.id_iqama_expiry}
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {driver.mobile_phone_1 ? (
                                                <a
                                                    href={`tel:${driver.mobile_phone_1}`}
                                                    className="flex items-center gap-1 font-mono text-primary hover:underline"
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    {driver.mobile_phone_1}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {driver.mobile_phone_2 ? (
                                                <a
                                                    href={`tel:${driver.mobile_phone_2}`}
                                                    className="flex items-center gap-1 font-mono text-muted-foreground hover:underline"
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    {driver.mobile_phone_2}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                                            {driver.home_city || (
                                                <span className="font-normal text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1">
                                                <DriverFormModal
                                                    companySlug={companySlug}
                                                    driver={driver}
                                                >
                                                    <button
                                                        type="button"
                                                        title="Edit Driver"
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                </DriverFormModal>

                                                <button
                                                    type="button"
                                                    title="Delete Driver"
                                                    onClick={() =>
                                                        openDelete(driver)
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
