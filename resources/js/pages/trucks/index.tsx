import { Head, router } from '@inertiajs/react';
import { Check, Minus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteTruckModal from '@/components/trucks/delete-truck-modal';
import TruckFormModal from '@/components/trucks/truck-form-modal';
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
import { index } from '@/routes/trucks';
import type { Company, Truck } from '@/types';

type Filters = {
    search: string;
    weightType: string;
    vehicleType: string;
    external: string;
    internal: string;
};

type Props = {
    trucks: Truck[];
    filters: Filters;
    currentCompany: Company;
};

const WEIGHT_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
    HEAVY: 'default',
    MEDIUM: 'secondary',
    LIGHT: 'outline',
};

const VEHICLE_LABELS: Record<string, string> = {
    TANKER: 'Tanker',
    TRUCK: 'Truck',
    LORRY: 'Lorry',
    DYANA: 'Dyana',
};

export default function TrucksIndex({
    trucks,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;
    const [search, setSearch] = useState(filters.search);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Truck | null>(null);

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            index({ current_company: companySlug }),
            {
                search: next.search ?? search,
                weight_type: next.weightType ?? filters.weightType,
                vehicle_type: next.vehicleType ?? filters.vehicleType,
                external: next.external ?? filters.external,
                internal: next.internal ?? filters.internal,
            },
            { preserveState: true, replace: true },
        );
    };

    const openDelete = (truck: Truck) => {
        setDeleting(truck);
        setDeleteOpen(true);
    };

    return (
        <>
            <Head title="Trucks" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Trucks"
                        description="Manage your fleet of trucks, tankers, lorries, and dyanas."
                    />

                    <TruckFormModal companySlug={companySlug}>
                        <Button data-test="trucks-new-button">
                            <Plus className="h-4 w-4" /> Add Truck
                        </Button>
                    </TruckFormModal>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters({ search: e.target.value });
                            }}
                            placeholder="Search by license plate..."
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filters.weightType || 'ALL'}
                        onValueChange={(value) =>
                            applyFilters({
                                weightType: value === 'ALL' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Weight: All</SelectItem>
                            <SelectItem value="HEAVY">Heavy</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="LIGHT">Light</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.vehicleType || 'ALL'}
                        onValueChange={(value) =>
                            applyFilters({
                                vehicleType: value === 'ALL' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Vehicle: All</SelectItem>
                            <SelectItem value="TANKER">Tanker</SelectItem>
                            <SelectItem value="TRUCK">Truck</SelectItem>
                            <SelectItem value="LORRY">Lorry</SelectItem>
                            <SelectItem value="DYANA">Dyana</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.external || 'ALL'}
                        onValueChange={(value) =>
                            applyFilters({
                                external: value === 'ALL' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">External: All</SelectItem>
                            <SelectItem value="YES">External: Yes</SelectItem>
                            <SelectItem value="NO">External: No</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.internal || 'ALL'}
                        onValueChange={(value) =>
                            applyFilters({
                                internal: value === 'ALL' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Internal: All</SelectItem>
                            <SelectItem value="YES">Internal: Yes</SelectItem>
                            <SelectItem value="NO">Internal: No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    {trucks.length === 0 ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">
                            No trucks match the current filters.
                        </p>
                    ) : (
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    <th className="w-12 px-4 py-3 text-center">
                                        #
                                    </th>
                                    <th className="px-4 py-3">Type (Weight)</th>
                                    <th className="px-4 py-3">
                                        Type (Vehicle)
                                    </th>
                                    <th className="px-4 py-3">License Plate</th>
                                    <th className="px-4 py-3 text-center">
                                        External
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Internal
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {trucks.map((truck, idx) => (
                                    <tr
                                        key={truck.id}
                                        data-test="truck-row"
                                        className="hover:bg-muted/40"
                                    >
                                        <td className="px-4 py-3 text-center font-mono text-[11px] text-muted-foreground">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={
                                                    WEIGHT_BADGE[
                                                        truck.weight_type
                                                    ]
                                                }
                                            >
                                                {truck.weight_type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {VEHICLE_LABELS[
                                                truck.vehicle_type
                                            ] ?? truck.vehicle_type}
                                        </td>
                                        <td className="px-4 py-3 font-mono font-bold">
                                            {truck.license_plate}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {truck.is_external ? (
                                                <Check className="mx-auto h-4 w-4 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {truck.is_internal ? (
                                                <Check className="mx-auto h-4 w-4 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <TruckFormModal
                                                    companySlug={companySlug}
                                                    truck={truck}
                                                >
                                                    <button
                                                        type="button"
                                                        title="Edit Truck"
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                </TruckFormModal>

                                                <button
                                                    type="button"
                                                    title="Delete Truck"
                                                    onClick={() =>
                                                        openDelete(truck)
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

            <DeleteTruckModal
                companySlug={companySlug}
                truck={deleting}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    );
}

TrucksIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Trucks',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
