import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/customers';
import type { Customer } from '@/types';

type Props = PropsWithChildren<{
    companySlug: string;
    customer?: Customer;
}>;

export default function CustomerFormModal({
    companySlug,
    customer,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const isEditing = Boolean(customer);

    const formOptions = isEditing
        ? update.form({ current_company: companySlug, customer: customer!.id })
        : store.form({ current_company: companySlug });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <Form
                    key={String(open)}
                    {...formOptions}
                    className="space-y-6"
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {isEditing
                                        ? 'Edit customer'
                                        : 'New customer'}
                                </DialogTitle>
                                <DialogDescription>
                                    Customers are linked to contracts and
                                    transport orders.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Al Nahda Trading Co."
                                    defaultValue={customer?.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="cr_number">CR Number</Label>
                                    <Input
                                        id="cr_number"
                                        name="cr_number"
                                        placeholder="e.g. 4030123456"
                                        defaultValue={customer?.cr_number}
                                        required
                                    />
                                    <InputError message={errors.cr_number} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="unified_number">
                                        Unified Number
                                    </Label>
                                    <Input
                                        id="unified_number"
                                        name="unified_number"
                                        placeholder="e.g. 7001234567"
                                        defaultValue={customer?.unified_number}
                                        required
                                    />
                                    <InputError
                                        message={errors.unified_number}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="vat_number">VAT Number</Label>
                                <Input
                                    id="vat_number"
                                    name="vat_number"
                                    placeholder="e.g. 310123456700003"
                                    defaultValue={customer?.vat_number}
                                    required
                                />
                                <InputError message={errors.vat_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    placeholder="e.g. Industrial Area, Riyadh 14332, Saudi Arabia"
                                    defaultValue={customer?.address}
                                    required
                                />
                                <InputError message={errors.address} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {isEditing
                                        ? 'Save changes'
                                        : 'Create customer'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
