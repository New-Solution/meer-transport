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
import { leave as leaveCompanyAction } from '@/routes/companies';
import type { Company } from '@/types';

type Props = {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function LeaveCompanyModal({
    company,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const leaveCompany = () => {
        if (!company) {
            return;
        }

        router.visit(leaveCompanyAction(company.slug), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave company</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to leave{' '}
                        <strong>{company?.name}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="leave-company-confirm"
                        disabled={processing}
                        onClick={leaveCompany}
                    >
                        Leave company
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
