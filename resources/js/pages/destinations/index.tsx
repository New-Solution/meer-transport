import { Head, router } from '@inertiajs/react';
import {
    ExternalLink,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import DeleteDestinationModal from '@/components/destinations/delete-destination-modal';
import DestinationFormModal from '@/components/destinations/destination-form-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import { index } from '@/routes/destinations';
import type { Company, Destination } from '@/types';

type Props = {
    destinations: Destination[];
    filters: { search: string };
    currentCompany: Company;
};

export default function DestinationsIndex({
    destinations,
    filters,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;
    const { can } = usePermissions();
    const [search, setSearch] = useState(filters.search);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Destination | null>(null);

    const applyFilters = (next: Partial<typeof filters>) => {
        router.get(
            index({ current_company: companySlug }),
            { search: next.search ?? search },
            { preserveState: true, replace: true },
        );
    };

    const openDelete = (destination: Destination) => {
        setDeleting(destination);
        setDeleteOpen(true);
    };

    return (
        <>
            <Head title="Destinations" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Destinations"
                        description="Manage delivery hubs, industrial yards, and specific drop-off locations with Google Maps navigation."
                    />

                    {can('destinations:create') ? (
                        <DestinationFormModal companySlug={companySlug}>
                            <Button data-test="destinations-new-button">
                                <Plus className="h-4 w-4" /> Add Destination
                            </Button>
                        </DestinationFormModal>
                    ) : null}
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters({ search: e.target.value });
                        }}
                        placeholder="Search by destination name..."
                        className="pl-9"
                    />
                </div>

                <div className="rounded-xl border">
                    <div className="border-b px-4 py-3 text-sm font-semibold">
                        All Destinations ({destinations.length})
                    </div>
                    <div className="overflow-x-auto">
                        {destinations.length === 0 ? (
                            <p className="py-16 text-center text-sm text-muted-foreground">
                                No destinations match the current search.
                            </p>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="w-16 px-6 py-3 font-semibold">
                                            #
                                        </th>
                                        <th className="px-6 py-3 font-semibold">
                                            Destination Name
                                        </th>
                                        <th className="px-6 py-3 font-semibold">
                                            Google Maps Link
                                        </th>
                                        <th className="px-6 py-3 font-semibold">
                                            Created Date
                                        </th>
                                        <th className="w-28 px-6 py-3 text-right font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {destinations.map((destination, idx) => (
                                        <tr
                                            key={destination.id}
                                            data-test="destination-row"
                                            className="hover:bg-muted/40"
                                        >
                                            <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                                                {idx + 1}
                                            </td>
                                            <td className="px-6 py-3.5 font-medium">
                                                {destination.name}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                {destination.google_maps_url ? (
                                                    <a
                                                        href={
                                                            destination.google_maps_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                                    >
                                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                        View on Map
                                                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 text-xs text-muted-foreground">
                                                {destination.created_at ?? '—'}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    {can(
                                                        'destinations:edit',
                                                    ) ? (
                                                        <DestinationFormModal
                                                            companySlug={
                                                                companySlug
                                                            }
                                                            destination={
                                                                destination
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                title="Edit Destination"
                                                                className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                        </DestinationFormModal>
                                                    ) : null}

                                                    {can(
                                                        'destinations:delete',
                                                    ) ? (
                                                        <button
                                                            type="button"
                                                            title="Delete Destination"
                                                            onClick={() =>
                                                                openDelete(
                                                                    destination,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                </div>
            </div>

            <DeleteDestinationModal
                companySlug={companySlug}
                destination={deleting}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    );
}

DestinationsIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Destinations',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
