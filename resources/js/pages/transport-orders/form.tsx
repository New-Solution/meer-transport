import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { index, store, update } from '@/routes/transport-orders';
import type {
    Company,
    OrderContractOption,
    OrderCustomerOption,
    OrderDriverOption,
    OrderTruckOption,
    TransportOrderDetail,
} from '@/types';

type TripRow = {
    key: string;
    id?: number;
    planned_pickup_date: string;
    planned_delivery_date: string;
    truck_id: string;
    driver_id: string;
    truck_amount: string;
    special_notes: string;
};

type ChargeRow = {
    type: 'return' | 'stay' | 'stop' | 'additional';
    label: string;
    enabled: boolean;
    applied_price: string;
};

type Props = {
    order: TransportOrderDetail | null;
    canOverridePrice: boolean;
    customers: OrderCustomerOption[];
    contracts: OrderContractOption[];
    trucks: OrderTruckOption[];
    drivers: OrderDriverOption[];
    currentCompany: Company;
};

function emptyTrip(): TripRow {
    return {
        key: crypto.randomUUID(),
        planned_pickup_date: '',
        planned_delivery_date: '',
        truck_id: '',
        driver_id: '',
        truck_amount: '',
        special_notes: '',
    };
}

const CHARGE_LABELS: Record<ChargeRow['type'], string> = {
    return: 'Return',
    stay: 'Stay',
    stop: 'Stop',
    additional: 'Additional',
};

export default function TransportOrderForm({
    order,
    canOverridePrice,
    customers,
    contracts,
    trucks,
    drivers,
    currentCompany,
}: Props) {
    const isEditing = Boolean(order);
    const companySlug = currentCompany.slug;
    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, put, processing, errors, transform } = useForm(
        {
            order_date: order?.order_date ?? today,
            required_delivery_date: order?.required_delivery_date ?? today,
            customer_id: order ? String(order.customer_id) : '',
            contract_id: order ? String(order.contract_id) : '',
            contract_route_id: order ? String(order.contract_route_id) : '',
            customer_po_number: order?.customer_po_number ?? '',
            applied_price: order ? String(order.applied_price) : '',
            override_reason: order?.override_reason ?? '',
            loading_instructions: order?.loading_instructions ?? '',
            delivery_instructions: order?.delivery_instructions ?? '',
            internal_remarks: order?.internal_remarks ?? '',
        },
    );

    const [trips, setTrips] = useState<TripRow[]>(
        order
            ? order.trips.map((trip) => ({
                  key: String(trip.id),
                  id: trip.id,
                  planned_pickup_date: trip.planned_pickup_date,
                  planned_delivery_date: trip.planned_delivery_date,
                  truck_id: trip.truck_id ? String(trip.truck_id) : '',
                  driver_id: trip.driver_id ? String(trip.driver_id) : '',
                  truck_amount: String(trip.truck_amount),
                  special_notes: trip.special_notes ?? '',
              }))
            : [emptyTrip()],
    );

    const [charges, setCharges] = useState<ChargeRow[]>(
        order
            ? order.additional_charges.map((charge) => ({
                  type: charge.type,
                  label: charge.label,
                  enabled: charge.enabled,
                  applied_price: String(charge.applied_price),
              }))
            : (['return', 'stay', 'stop', 'additional'] as const).map(
                  (type) => ({
                      type,
                      label: CHARGE_LABELS[type],
                      enabled: false,
                      applied_price: '0',
                  }),
              ),
    );

    const customerContracts = useMemo(
        () =>
            contracts.filter(
                (contract) => String(contract.customer_id) === data.customer_id,
            ),
        [contracts, data.customer_id],
    );

    const selectedContract = useMemo(
        () =>
            contracts.find(
                (contract) => String(contract.id) === data.contract_id,
            ),
        [contracts, data.contract_id],
    );

    const contractRoutes = selectedContract?.routes ?? [];

    const selectRoute = (routeId: string) => {
        setData('contract_route_id', routeId);

        const route = contractRoutes.find((r) => String(r.id) === routeId);
        if (!route) {
            return;
        }

        if (!isEditing) {
            setData('applied_price', String(route.price));
        }

        setCharges([
            {
                type: 'return',
                label: 'Return',
                enabled: false,
                applied_price: String(route.return_price),
            },
            {
                type: 'stay',
                label: 'Stay',
                enabled: false,
                applied_price: String(route.stay_price),
            },
            {
                type: 'stop',
                label: 'Stop',
                enabled: false,
                applied_price: String(route.stop_price),
            },
            {
                type: 'additional',
                label: 'Additional',
                enabled: false,
                applied_price: String(route.additional_price),
            },
        ]);
    };

    const updateTrip = (key: string, field: keyof TripRow, value: string) => {
        setTrips((current) =>
            current.map((trip) =>
                trip.key === key ? { ...trip, [field]: value } : trip,
            ),
        );
    };

    const addTrip = () => setTrips((current) => [...current, emptyTrip()]);

    const removeTrip = (key: string) =>
        setTrips((current) =>
            current.length > 1
                ? current.filter((trip) => trip.key !== key)
                : current,
        );

    const updateCharge = (
        type: ChargeRow['type'],
        field: 'enabled' | 'applied_price',
        value: boolean | string,
    ) => {
        setCharges((current) =>
            current.map((charge) =>
                charge.type === type ? { ...charge, [field]: value } : charge,
            ),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((currentData) => ({
            ...currentData,
            additional_charges: charges.map((charge) => ({
                type: charge.type,
                enabled: charge.enabled,
                applied_price: charge.applied_price || '0',
            })),
            trips: trips.map((trip) => ({
                id: trip.id,
                planned_pickup_date: trip.planned_pickup_date,
                planned_delivery_date: trip.planned_delivery_date,
                truck_id: trip.truck_id || null,
                driver_id: trip.driver_id || null,
                truck_amount: trip.truck_amount || '0',
                special_notes: trip.special_notes || null,
            })),
        }));

        if (isEditing && order) {
            put(
                update.url({
                    current_company: companySlug,
                    transport_order: order.id,
                }),
            );
        } else {
            post(store.url({ current_company: companySlug }));
        }
    };

    const fieldErrors = errors as Record<string, string>;

    return (
        <>
            <Head
                title={
                    isEditing ? 'Edit Transport Order' : 'New Transport Order'
                }
            />

            <form
                onSubmit={handleSubmit}
                className="flex flex-col space-y-6 p-4"
            >
                <Heading
                    title={
                        isEditing
                            ? 'Edit transport order'
                            : 'New transport order'
                    }
                    description="Pick a customer, an eligible contract, and a route to build trips against."
                />

                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <Label>Customer</Label>
                        <Select
                            value={data.customer_id}
                            onValueChange={(value) => {
                                setData('customer_id', value);
                                setData('contract_id', '');
                                setData('contract_route_id', '');
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={String(customer.id)}
                                    >
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={fieldErrors.customer_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Contract</Label>
                        <Select
                            value={data.contract_id}
                            onValueChange={(value) => {
                                setData('contract_id', value);
                                setData('contract_route_id', '');
                            }}
                            disabled={!data.customer_id}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select contract" />
                            </SelectTrigger>
                            <SelectContent>
                                {customerContracts.map((contract) => (
                                    <SelectItem
                                        key={contract.id}
                                        value={String(contract.id)}
                                    >
                                        {contract.contract_number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={fieldErrors.contract_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Route</Label>
                        <Select
                            value={data.contract_route_id}
                            onValueChange={selectRoute}
                            disabled={!data.contract_id}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select route" />
                            </SelectTrigger>
                            <SelectContent>
                                {contractRoutes.map((route) => (
                                    <SelectItem
                                        key={route.id}
                                        value={String(route.id)}
                                    >
                                        {route.from_city} &rarr; {route.to_city}{' '}
                                        (SAR {route.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={fieldErrors.contract_route_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Order date</Label>
                        <Input
                            type="date"
                            value={data.order_date}
                            onChange={(e) =>
                                setData('order_date', e.target.value)
                            }
                            required
                        />
                        <InputError message={fieldErrors.order_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Required delivery date</Label>
                        <Input
                            type="date"
                            value={data.required_delivery_date}
                            onChange={(e) =>
                                setData(
                                    'required_delivery_date',
                                    e.target.value,
                                )
                            }
                            required
                        />
                        <InputError
                            message={fieldErrors.required_delivery_date}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Customer PO number</Label>
                        <Input
                            value={data.customer_po_number}
                            onChange={(e) =>
                                setData('customer_po_number', e.target.value)
                            }
                        />
                        <InputError message={fieldErrors.customer_po_number} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Applied price (SAR per trip)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={data.applied_price}
                            onChange={(e) =>
                                setData('applied_price', e.target.value)
                            }
                            disabled={!canOverridePrice}
                            placeholder="Contract rate"
                        />
                        <InputError message={fieldErrors.applied_price} />
                    </div>

                    {canOverridePrice ? (
                        <div className="grid gap-2">
                            <Label>Override reason</Label>
                            <Input
                                value={data.override_reason}
                                onChange={(e) =>
                                    setData('override_reason', e.target.value)
                                }
                                placeholder="Required if price differs from contract"
                            />
                            <InputError message={fieldErrors.override_reason} />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                    <Heading variant="small" title="Additional charges" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {charges.map((charge) => (
                            <div
                                key={charge.type}
                                className="space-y-2 rounded-md border p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={charge.enabled}
                                        onCheckedChange={(checked) =>
                                            updateCharge(
                                                charge.type,
                                                'enabled',
                                                Boolean(checked),
                                            )
                                        }
                                    />
                                    <Label className="font-normal">
                                        {charge.label}
                                    </Label>
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={charge.applied_price}
                                    onChange={(e) =>
                                        updateCharge(
                                            charge.type,
                                            'applied_price',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <Heading
                            variant="small"
                            title="Trips"
                            description="At least one trip is required"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={addTrip}
                        >
                            <Plus /> Add trip
                        </Button>
                    </div>
                    <InputError message={fieldErrors.trips} />

                    {trips.map((trip, index) => (
                        <div
                            key={trip.key}
                            data-test="order-trip-row"
                            className="grid grid-cols-2 gap-3 rounded-md border p-3 sm:grid-cols-6"
                        >
                            <div className="grid gap-1">
                                <Label>Pickup date</Label>
                                <Input
                                    type="date"
                                    value={trip.planned_pickup_date}
                                    onChange={(e) =>
                                        updateTrip(
                                            trip.key,
                                            'planned_pickup_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={
                                        fieldErrors[
                                            `trips.${index}.planned_pickup_date`
                                        ]
                                    }
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label>Delivery date</Label>
                                <Input
                                    type="date"
                                    value={trip.planned_delivery_date}
                                    onChange={(e) =>
                                        updateTrip(
                                            trip.key,
                                            'planned_delivery_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={
                                        fieldErrors[
                                            `trips.${index}.planned_delivery_date`
                                        ]
                                    }
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label>Truck</Label>
                                <Select
                                    value={trip.truck_id}
                                    onValueChange={(value) =>
                                        updateTrip(trip.key, 'truck_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trucks.map((truck) => (
                                            <SelectItem
                                                key={truck.id}
                                                value={String(truck.id)}
                                            >
                                                {truck.license_plate}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1">
                                <Label>Driver</Label>
                                <Select
                                    value={trip.driver_id}
                                    onValueChange={(value) =>
                                        updateTrip(trip.key, 'driver_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drivers.map((driver) => (
                                            <SelectItem
                                                key={driver.id}
                                                value={String(driver.id)}
                                            >
                                                {driver.first_name}{' '}
                                                {driver.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1">
                                <Label>Truck amount (SAR)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={trip.truck_amount}
                                    onChange={(e) =>
                                        updateTrip(
                                            trip.key,
                                            'truck_amount',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTrip(trip.key)}
                                    disabled={trips.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" /> Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <Label>Loading instructions</Label>
                        <Textarea
                            value={data.loading_instructions}
                            onChange={(e) =>
                                setData('loading_instructions', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Delivery instructions</Label>
                        <Textarea
                            value={data.delivery_instructions}
                            onChange={(e) =>
                                setData('delivery_instructions', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Internal remarks</Label>
                        <Textarea
                            value={data.internal_remarks}
                            onChange={(e) =>
                                setData('internal_remarks', e.target.value)
                            }
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={processing}>
                        {isEditing ? 'Save changes' : 'Create transport order'}
                    </Button>
                </div>
            </form>
        </>
    );
}

TransportOrderForm.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Transport Orders',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
