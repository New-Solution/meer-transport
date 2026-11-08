import { Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteTruckModal from '@/components/trucks/delete-truck-modal';
import TruckFormModal from '@/components/trucks/truck-form-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index } from '@/routes/trucks';
import type { Company, Truck } from '@/types';

type Props = {
    trucks: Truck[];
    currentCompany: Company;
};

export default function TrucksIndex({ trucks, currentCompany }: Props) {
    const companySlug = currentCompany.slug;

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Truck | null>(null);

    const openDelete = (truck: Truck) => {
        setDeleting(truck);
        setDeleteOpen(true);
    };

    return (
        <>
            <Head title="Trucks" />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Trucks"
                        description="Fleet of internal and external trucks"
                    />

                    <TruckFormModal companySlug={companySlug}>
                        <Button data-test="trucks-new-button">
                            <Plus /> New truck
                        </Button>
                    </TruckFormModal>
                </div>

                <div className="space-y-3">
                    {trucks.map((truck) => (
                        <div
                            key={truck.id}
                            data-test="truck-row"
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {truck.license_plate}
                                    </span>
                                    <Badge variant="outline">
                                        {truck.weight_type}
                                    </Badge>
                                    <Badge variant="outline">
                                        {truck.vehicle_type}
                                    </Badge>
                                    {truck.is_internal ? (
                                        <Badge variant="secondary">
                                            Internal
                                        </Badge>
                                    ) : null}
                                    {truck.is_external ? (
                                        <Badge variant="secondary">
                                            External
                                        </Badge>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <TruckFormModal
                                    companySlug={companySlug}
                                    truck={truck}
                                >
                                    <Button variant="ghost" size="sm">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TruckFormModal>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDelete(truck)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {trucks.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No trucks yet. Add your first one above.
                        </p>
                    ) : null}
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
