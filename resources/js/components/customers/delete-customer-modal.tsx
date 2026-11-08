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
import { destroy } from '@/routes/customers';
import type { Customer } from '@/types';

type Props = {
    companySlug: string;
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteCustomerModal({
    companySlug,
    customer,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!customer) {
            return;
        }

        router.visit(
            destroy({ current_company: companySlug, customer: customer.id }),
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
                    <DialogTitle>Delete customer</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to permanently delete{' '}
                        <strong>{customer?.name}</strong>? If this customer has
                        contracts, archive it instead.
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
                        Delete customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
