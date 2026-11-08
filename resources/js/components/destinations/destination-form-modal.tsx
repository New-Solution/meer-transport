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
import { store, update } from '@/routes/destinations';
import type { Destination } from '@/types';

type Props = PropsWithChildren<{
    companySlug: string;
    destination?: Destination;
}>;

export default function DestinationFormModal({
    companySlug,
    destination,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const isEditing = Boolean(destination);

    const formOptions = isEditing
        ? update.form({
              current_company: companySlug,
              destination: destination!.id,
          })
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
                                    {isEditing
                                        ? 'Edit destination'
                                        : 'New destination'}
                                </DialogTitle>
                                <DialogDescription>
                                    Destinations are reusable drop-off locations
                                    used on contract routes.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Jeddah Islamic Port"
                                    defaultValue={destination?.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="google_maps_url">
                                    Google Maps URL
                                </Label>
                                <Input
                                    id="google_maps_url"
                                    name="google_maps_url"
                                    type="url"
                                    placeholder="https://maps.app.goo.gl/..."
                                    defaultValue={destination?.google_maps_url}
                                    required
                                />
                                <InputError message={errors.google_maps_url} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {isEditing
                                        ? 'Save changes'
                                        : 'Create destination'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
