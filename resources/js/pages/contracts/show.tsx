import { Head, Link, router } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { ContractStatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import {
    activate,
    archive,
    cancel,
    destroy,
    edit,
    index,
} from '@/routes/contracts';
import type { Company, ContractDetail } from '@/types';

type Props = {
    contract: ContractDetail;
    currentCompany: Company;
};

function formatSar(amount: number) {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function ContractShow({ contract, currentCompany }: Props) {
    const companySlug = currentCompany.slug;
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reason, setReason] = useState('');

    const doActivate = () => {
        router.patch(
            activate({ current_company: companySlug, contract: contract.id }),
        );
    };

    const doCancel = () => {
        router.patch(
            cancel({ current_company: companySlug, contract: contract.id }),
            { reason },
            { onSuccess: () => setCancelOpen(false) },
        );
    };

    const doArchive = () => {
        router.patch(
            archive({ current_company: companySlug, contract: contract.id }),
        );
    };

    const doDelete = () => {
        router.delete(
            destroy({ current_company: companySlug, contract: contract.id }),
        );
    };

    return (
        <>
            <Head title={`Contract ${contract.contract_number}`} />

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title={contract.contract_number}
                        description={`Customer: ${contract.customer_snapshot.name}`}
                    />

                    <div className="flex items-center gap-2">
                        <ContractStatusBadge
                            status={contract.resolved_status}
                        />

                        {contract.resolved_status === 'DRAFT' ? (
                            <>
                                <Button variant="secondary" asChild>
                                    <Link
                                        href={edit({
                                            current_company: companySlug,
                                            contract: contract.id,
                                        })}
                                    >
                                        <Pencil className="h-4 w-4" /> Edit
                                    </Link>
                                </Button>
                                <Button onClick={doActivate}>Activate</Button>
                                <Button
                                    variant="destructive"
                                    onClick={doDelete}
                                >
                                    Delete
                                </Button>
                            </>
                        ) : null}

                        {contract.resolved_status === 'ACTIVE' ? (
                            <>
                                <Button variant="secondary" asChild>
                                    <Link
                                        href={edit({
                                            current_company: companySlug,
                                            contract: contract.id,
                                        })}
                                    >
                                        <Pencil className="h-4 w-4" /> Edit
                                    </Link>
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setCancelOpen(true)}
                                >
                                    Cancel contract
                                </Button>
                            </>
                        ) : null}

                        {!contract.archived_at ? (
                            <Button variant="outline" onClick={doArchive}>
                                Archive
                            </Button>
                        ) : (
                            <Badge variant="secondary">Archived</Badge>
                        )}
                    </div>
                </div>

                {contract.status === 'CANCELLED' ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
                        Cancelled {contract.cancelled_at} by{' '}
                        {contract.cancelled_by}. Reason:{' '}
                        {contract.cancellation_reason}
                    </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Contract date
                        </div>
                        <div>{contract.contract_date}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Expiry date
                        </div>
                        <div>{contract.expiry_date}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">
                            CR Number
                        </div>
                        <div>{contract.customer_snapshot.cr_number}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">
                            VAT Number
                        </div>
                        <div>{contract.customer_snapshot.vat_number}</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Heading variant="small" title="Routes" />

                    {contract.routes.map((route) => (
                        <div
                            key={route.id}
                            data-test="contract-route-detail"
                            className="flex items-center justify-between rounded-lg border p-4"
                        >
                            <div>
                                <div className="font-medium">
                                    {route.from_city} &rarr; {route.to_city}
                                    {route.destination_name
                                        ? ` (${route.destination_name})`
                                        : ''}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {route.vehicle_type} &middot; SAR{' '}
                                    {formatSar(route.price)}
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                <div>
                                    Return: SAR {formatSar(route.return_price)}
                                </div>
                                <div>
                                    Stay: SAR {formatSar(route.stay_price)}
                                </div>
                                <div>
                                    Stop: SAR {formatSar(route.stop_price)}
                                </div>
                                <div>
                                    Additional: SAR{' '}
                                    {formatSar(route.additional_price)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel contract</DialogTitle>
                        <DialogDescription>
                            This preserves all routes and history for audit, but
                            the contract will no longer be usable for new
                            transport orders.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Optional"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Keep contract</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={doCancel}>
                            Cancel contract
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ContractShow.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Contracts',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
