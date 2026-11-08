import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store, update } from '@/routes/trucks';
import type { Truck } from '@/types';

const WEIGHT_TYPES = [
    { value: 'HEAVY', label: 'Heavy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LIGHT', label: 'Light' },
];

const VEHICLE_TYPES = [
    { value: 'TANKER', label: 'Tanker' },
    { value: 'TRUCK', label: 'Truck' },
    { value: 'LORRY', label: 'Lorry' },
    { value: 'DYANA', label: 'Dyana' },
];

type Props = PropsWithChildren<{
    companySlug: string;
    truck?: Truck;
}>;

export default function TruckFormModal({
    companySlug,
    truck,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const isEditing = Boolean(truck);

    const formOptions = isEditing
        ? update.form({ current_company: companySlug, truck: truck!.id })
        : store.form({ current_company: companySlug });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
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
                                    {isEditing ? 'Edit truck' : 'New truck'}
                                </DialogTitle>
                                <DialogDescription>
                                    Trucks can be assigned to transport trips.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="weight_type">Weight</Label>
                                    <Select
                                        name="weight_type"
                                        defaultValue={truck?.weight_type}
                                    >
                                        <SelectTrigger id="weight_type">
                                            <SelectValue placeholder="Select weight" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WEIGHT_TYPES.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.weight_type} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="vehicle_type">
                                        Vehicle
                                    </Label>
                                    <Select
                                        name="vehicle_type"
                                        defaultValue={truck?.vehicle_type}
                                    >
                                        <SelectTrigger id="vehicle_type">
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VEHICLE_TYPES.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.vehicle_type} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="license_plate">
                                    License Plate
                                </Label>
                                <Input
                                    id="license_plate"
                                    name="license_plate"
                                    placeholder="e.g. ABC 1234 or أ ب ج ١٢٣٤"
                                    defaultValue={truck?.license_plate}
                                    required
                                    className="font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Supports English and Arabic license plates.
                                    Must be unique per company.
                                </p>
                                <InputError message={errors.license_plate} />
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_internal"
                                        name="is_internal"
                                        defaultChecked={
                                            truck?.is_internal ?? true
                                        }
                                    />
                                    <Label
                                        htmlFor="is_internal"
                                        className="font-normal"
                                    >
                                        Internal
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_external"
                                        name="is_external"
                                        defaultChecked={
                                            truck?.is_external ?? false
                                        }
                                    />
                                    <Label
                                        htmlFor="is_external"
                                        className="font-normal"
                                    >
                                        External
                                    </Label>
                                </div>
                            </div>
                            <InputError message={errors.is_external} />

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {isEditing ? 'Save changes' : 'Add truck'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
