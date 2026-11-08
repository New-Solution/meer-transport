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
import { destroy } from '@/routes/drivers';
import type { Driver } from '@/types';

type Props = {
    companySlug: string;
    driver: Driver | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteDriverModal({
    companySlug,
    driver,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!driver) {
            return;
        }

        router.visit(
            destroy({ current_company: companySlug, driver: driver.id }),
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
                    <DialogTitle>Delete driver</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>
                            {driver?.first_name} {driver?.last_name}
                        </strong>
                        ? This cannot be undone.
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
                        Delete driver
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
