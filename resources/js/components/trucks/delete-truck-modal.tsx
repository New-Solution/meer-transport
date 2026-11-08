import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { destroy } from '@/routes/trucks';
import type { Truck } from '@/types';

type Props = {
    companySlug: string;
    truck: Truck | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteTruckModal({
    companySlug,
    truck,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!truck) {
            return;
        }

        router.visit(
            destroy({ current_company: companySlug, truck: truck.id }),
            {
                method: 'delete',
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete truck</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>{truck?.license_plate}</strong>? This cannot be
                        undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        disabled={processing}
                        onClick={confirmDelete}
                    >
                        Delete truck
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
