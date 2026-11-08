import { Form } from '@inertiajs/react';
import { Phone, Shield, User } from 'lucide-react';
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
                                    {isEditing ? 'Edit Driver' : 'Add Driver'}
                                </DialogTitle>
                                <DialogDescription>
                                    {isEditing
                                        ? 'Update driver credentials, contact numbers, and home city.'
                                        : 'Register a new heavy vehicle or transport driver.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5 border-b pb-1 text-xs font-bold tracking-wider uppercase">
                                    <User className="h-3.5 w-3.5 text-primary" />
                                    Driver Personal Details
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">
                                            First Name
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            placeholder="e.g. Mohammed"
                                            defaultValue={driver?.first_name}
                                            required
                                        />
                                        <InputError
                                            message={errors.first_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">
                                            Last Name
                                        </Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            placeholder="e.g. Al-Otaibi"
                                            defaultValue={driver?.last_name}
                                            required
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nationality">
                                            Nationality
                                        </Label>
                                        <Input
                                            id="nationality"
                                            name="nationality"
                                            placeholder="e.g. Saudi"
                                            defaultValue={
                                                driver?.nationality ??
                                                (isEditing ? '' : 'Saudi')
                                            }
                                        />
                                        <InputError
                                            message={errors.nationality}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="home_city">
                                            Home (City)
                                        </Label>
                                        <Input
                                            id="home_city"
                                            name="home_city"
                                            placeholder="e.g. Riyadh"
                                            defaultValue={
                                                driver?.home_city ?? ''
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Driver&apos;s residential or home
                                            base city.
                                        </p>
                                        <InputError
                                            message={errors.home_city}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-1.5 border-b pb-1 text-xs font-bold tracking-wider uppercase">
                                    <Shield className="h-3.5 w-3.5 text-primary" />
                                    Licensing & Identification
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="license_no">
                                            License No
                                        </Label>
                                        <Input
                                            id="license_no"
                                            name="license_no"
                                            placeholder="e.g. DL-98765432"
                                            defaultValue={
                                                driver?.license_no ?? ''
                                            }
                                            className="font-mono"
                                        />
                                        <InputError
                                            message={errors.license_no}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="license_expiry">
                                            License Expiry
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

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="saudi_id_iqama_no">
                                            Saudi ID / Iqama No
                                        </Label>
                                        <Input
                                            id="saudi_id_iqama_no"
                                            name="saudi_id_iqama_no"
                                            placeholder="e.g. 10xxxxxxxx or 24xxxxxxxx"
                                            defaultValue={
                                                driver?.saudi_id_iqama_no ?? ''
                                            }
                                            className="font-mono"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Must be unique per company when
                                            provided.
                                        </p>
                                        <InputError
                                            message={errors.saudi_id_iqama_no}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="id_iqama_expiry">
                                            ID / Iqama Expiry
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
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-1.5 border-b pb-1 text-xs font-bold tracking-wider uppercase">
                                    <Phone className="h-3.5 w-3.5 text-primary" />
                                    Mobile Phone Numbers
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="mobile_phone_1">
                                            Mobile Phone Number 1
                                        </Label>
                                        <Input
                                            id="mobile_phone_1"
                                            name="mobile_phone_1"
                                            type="tel"
                                            placeholder="e.g. +966 50 123 4567 or 0501234567"
                                            defaultValue={
                                                driver?.mobile_phone_1 ?? ''
                                            }
                                            className="font-mono"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Supports Saudi (+966) and
                                            international prefixes.
                                        </p>
                                        <InputError
                                            message={errors.mobile_phone_1}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="mobile_phone_2">
                                            Mobile Phone Number 2
                                        </Label>
                                        <Input
                                            id="mobile_phone_2"
                                            name="mobile_phone_2"
                                            type="tel"
                                            placeholder="e.g. +966 55 987 6543 (optional)"
                                            defaultValue={
                                                driver?.mobile_phone_2 ?? ''
                                            }
                                            className="font-mono"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Alternative or emergency contact
                                            number.
                                        </p>
                                        <InputError
                                            message={errors.mobile_phone_2}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {isEditing
                                        ? 'Update Driver'
                                        : 'Save Driver'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
