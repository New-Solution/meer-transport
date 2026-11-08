import { Head } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteDestinationModal from '@/components/destinations/delete-destination-modal';
import DestinationFormModal from '@/components/destinations/destination-form-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index } from '@/routes/destinations';
import type { Company, Destination } from '@/types';

type Props = {
    destinations: Destination[];
    currentCompany: Company;
};

export default function DestinationsIndex({
    destinations,
    currentCompany,
}: Props) {
    const companySlug = currentCompany.slug;

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Destination | null>(null);

    const openDelete = (destination: Destination) => {
        setDeleting(destination);
        setDeleteOpen(true);
    };

    return (
        <>
            <Head title="Destinations" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Destinations"
                        description="Reusable drop-off locations used on contract routes"
                    />

                    <DestinationFormModal companySlug={companySlug}>
                        <Button data-test="destinations-new-button">
                            <Plus /> New destination
                        </Button>
                    </DestinationFormModal>
                </div>

                <div className="space-y-3">
                    {destinations.map((destination) => (
                        <div
                            key={destination.id}
                            data-test="destination-row"
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                            <div>
                                <div className="font-medium">
                                    {destination.name}
                                </div>
                                <a
                                    href={destination.google_maps_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                                >
                                    View on map{' '}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>

                            <div className="flex items-center gap-2">
                                <DestinationFormModal
                                    companySlug={companySlug}
                                    destination={destination}
                                >
                                    <Button variant="ghost" size="sm">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DestinationFormModal>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDelete(destination)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {destinations.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No destinations yet. Create your first one above.
                        </p>
                    ) : null}
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
