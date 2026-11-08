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
import { store, update } from '@/routes/drivers';
import type { Driver } from '@/types';

type Props = PropsWithChildren<{
    companySlug: string;
    driver?: Driver;
}>;

export default function DriverFormModal({
    companySlug,
    driver,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const isEditing = Boolean(driver);

    const formOptions = isEditing
        ? update.form({ current_company: companySlug, driver: driver!.id })
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
                                    {isEditing ? 'Edit driver' : 'New driver'}
                                </DialogTitle>
                                <DialogDescription>
                                    Drivers can be assigned to transport trips.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="first_name">
                                        First name
                                    </Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        defaultValue={driver?.first_name}
                                        required
                                    />
                                    <InputError message={errors.first_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="last_name">Last name</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        defaultValue={driver?.last_name}
                                        required
                                    />
                                    <InputError message={errors.last_name} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nationality">
                                        Nationality
                                    </Label>
                                    <Input
                                        id="nationality"
                                        name="nationality"
                                        defaultValue={driver?.nationality ?? ''}
                                    />
                                    <InputError message={errors.nationality} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="home_city">Home city</Label>
                                    <Input
                                        id="home_city"
                                        name="home_city"
                                        defaultValue={driver?.home_city ?? ''}
                                    />
                                    <InputError message={errors.home_city} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="license_no">
                                        License number
                                    </Label>
                                    <Input
                                        id="license_no"
                                        name="license_no"
                                        defaultValue={driver?.license_no ?? ''}
                                    />
                                    <InputError message={errors.license_no} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="license_expiry">
                                        License expiry
                                    </Label>
                                    <Input
                                        id="license_expiry"
                                        name="license_expiry"
                                        type="date"
                                        defaultValue={
                                            driver?.license_expiry ?? ''
                                        }
                                    />
                                    <InputError
                                        message={errors.license_expiry}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="saudi_id_iqama_no">
                                        Saudi ID / Iqama No.
                                    </Label>
                                    <Input
                                        id="saudi_id_iqama_no"
                                        name="saudi_id_iqama_no"
                                        defaultValue={
                                            driver?.saudi_id_iqama_no ?? ''
                                        }
                                    />
                                    <InputError
                                        message={errors.saudi_id_iqama_no}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="id_iqama_expiry">
                                        ID / Iqama expiry
                                    </Label>
                                    <Input
                                        id="id_iqama_expiry"
                                        name="id_iqama_expiry"
                                        type="date"
                                        defaultValue={
                                            driver?.id_iqama_expiry ?? ''
                                        }
                                    />
                                    <InputError
                                        message={errors.id_iqama_expiry}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="mobile_phone_1">
                                        Mobile phone 1
                                    </Label>
                                    <Input
                                        id="mobile_phone_1"
                                        name="mobile_phone_1"
                                        defaultValue={
                                            driver?.mobile_phone_1 ?? ''
                                        }
                                    />
                                    <InputError
                                        message={errors.mobile_phone_1}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="mobile_phone_2">
                                        Mobile phone 2
                                    </Label>
                                    <Input
                                        id="mobile_phone_2"
                                        name="mobile_phone_2"
                                        defaultValue={
                                            driver?.mobile_phone_2 ?? ''
                                        }
                                    />
                                    <InputError
                                        message={errors.mobile_phone_2}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {isEditing ? 'Save changes' : 'Add driver'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
