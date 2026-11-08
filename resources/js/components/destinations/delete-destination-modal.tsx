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
import { destroy } from '@/routes/destinations';
import type { Destination } from '@/types';

type Props = {
    companySlug: string;
    destination: Destination | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteDestinationModal({
    companySlug,
    destination,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!destination) {
            return;
        }

        router.visit(
            destroy({
                current_company: companySlug,
                destination: destination.id,
            }),
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
                    <DialogTitle>Delete destination</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>{destination?.name}</strong>? This cannot be
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
                        Delete destination
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
