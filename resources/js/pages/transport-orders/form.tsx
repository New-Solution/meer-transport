import { Head, Link, useForm } from '@inertiajs/react';
import {
    ExternalLink,
    MapPin,
    Plus,
    ShieldAlert,
    Trash2,
    Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    OrderDestinationOption,
    OrderDriverOption,
    OrderTruckOption,
    TransportOrderDetail,
} from '@/types';

type TripRow = {
    key: string;
    id?: number;
    planned_pickup_date: string;
    planned_delivery_date: string;
    special_notes: string;
    truck_type: string;
    truck_id: string;
    driver_id: string;
    truck_amount: string;
    cargo_description: string;
    cargo_quantity: string;
    cargo_unit: string;
    cargo_weight_kg: string;
};

type ChargeRow = {
    type: 'return' | 'stay' | 'stop' | 'additional';
    label: string;
    description: string;
    enabled: boolean;
    contract_price: string;
    applied_price: string;
};

type Props = {
    order: TransportOrderDetail | null;
    suggestedOrderNumber?: string;
    canOverridePrice: boolean;
    customers: OrderCustomerOption[];
    contracts: OrderContractOption[];
    destinations: OrderDestinationOption[];
    trucks: OrderTruckOption[];
    drivers: OrderDriverOption[];
    currentCompany: Company;
};

const CHARGE_META: Record<
    ChargeRow['type'],
    { label: string; description: string }
> = {
    return: {
        label: 'Return',
        description: 'Return trip / turnaround handling',
    },
    stay: { label: 'Stay', description: 'Overnight stay / detention' },
    stop: { label: 'Stop', description: 'Intermediate stops / offloads' },
    additional: {
        label: 'Additional',
        description: 'Ancillary services / gate / tolls',
    },
};

function emptyTrip(pickup: string, delivery: string): TripRow {
    return {
        key: crypto.randomUUID(),
        planned_pickup_date: pickup,
        planned_delivery_date: delivery,
        special_notes: '',
        truck_type: '',
        truck_id: '',
        driver_id: '',
        truck_amount: '0',
        cargo_description: '',
        cargo_quantity: '',
        cargo_unit: 'Pallets',
        cargo_weight_kg: '',
    };
}

function chargesFromRoute(route?: {
    return_price: number;
    stay_price: number;
    stop_price: number;
    additional_price: number;
}): ChargeRow[] {
    const priceByType: Record<ChargeRow['type'], number> = {
        return: route?.return_price ?? 0,
        stay: route?.stay_price ?? 0,
        stop: route?.stop_price ?? 0,
        additional: route?.additional_price ?? 0,
    };

    return (['return', 'stay', 'stop', 'additional'] as const).map((type) => ({
        type,
        label: CHARGE_META[type].label,
        description: CHARGE_META[type].description,
        enabled: false,
        contract_price: String(priceByType[type]),
        applied_price: String(priceByType[type]),
    }));
}

function money(value: number) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function TransportOrderForm({
    order,
    suggestedOrderNumber,
    canOverridePrice,
    customers,
    contracts,
    destinations,
    trucks,
    drivers,
    currentCompany,
}: Props) {
    const isEditing = Boolean(order);
    const companySlug = currentCompany.slug;
    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, put, processing, errors, transform } = useForm(
        {
            order_number: order?.order_number ?? suggestedOrderNumber ?? '',
            order_date: order?.order_date ?? today,
            required_delivery_date: order?.required_delivery_date ?? today,
            customer_id: order ? String(order.customer_id) : '',
            contract_id: order ? String(order.contract_id) : '',
            contract_route_id: order ? String(order.contract_route_id) : '',
            destination_id: order?.route_snapshot.destination_id
                ? String(order.route_snapshot.destination_id)
                : '',
            customer_po_number: order?.customer_po_number ?? '',
            applied_price: order ? String(order.applied_price) : '',
            override_reason: order?.override_reason ?? '',
            cargo_description: order?.cargo_details?.description ?? '',
            cargo_quantity:
                order?.cargo_details?.quantity !== undefined
                    ? String(order.cargo_details.quantity)
                    : '',
            cargo_unit: order?.cargo_details?.unit ?? 'Pallets',
            cargo_weight_kg:
                order?.cargo_details?.total_weight_kg !== undefined
                    ? String(order.cargo_details.total_weight_kg)
                    : '',
            loading_instructions: order?.loading_instructions ?? '',
            delivery_instructions: order?.delivery_instructions ?? '',
            internal_remarks: order?.internal_remarks ?? '',
        },
    );

    const [trips, setTrips] = useState<TripRow[]>(
        order
            ? order.trips.map((trip) => {
                  const truck = trucks.find((t) => t.id === trip.truck_id);

                  return {
                      key: String(trip.id),
                      id: trip.id,
                      planned_pickup_date: trip.planned_pickup_date,
                      planned_delivery_date: trip.planned_delivery_date,
                      special_notes: trip.special_notes ?? '',
                      truck_type: truck?.vehicle_type ?? '',
                      truck_id: trip.truck_id ? String(trip.truck_id) : '',
                      driver_id: trip.driver_id ? String(trip.driver_id) : '',
                      truck_amount: String(trip.truck_amount),
                      cargo_description: trip.cargo_details?.description ?? '',
                      cargo_quantity:
                          trip.cargo_details?.quantity !== undefined
                              ? String(trip.cargo_details.quantity)
                              : '',
                      cargo_unit: trip.cargo_details?.unit ?? 'Pallets',
                      cargo_weight_kg:
                          trip.cargo_details?.total_weight_kg !== undefined
                              ? String(trip.cargo_details.total_weight_kg)
                              : '',
                  };
              })
            : [emptyTrip(today, today)],
    );

    const [charges, setCharges] = useState<ChargeRow[]>(
        order
            ? order.additional_charges.map((charge) => ({
                  type: charge.type,
                  label: charge.label,
                  description: CHARGE_META[charge.type].description,
                  enabled: charge.enabled,
                  contract_price: String(charge.contract_price),
                  applied_price: String(charge.applied_price),
              }))
            : chargesFromRoute(),
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

    const selectedRoute = useMemo(
        () =>
            contractRoutes.find(
                (route) => String(route.id) === data.contract_route_id,
            ),
        [contractRoutes, data.contract_route_id],
    );

    const selectedDestination = destinations.find(
        (destination) => String(destination.id) === data.destination_id,
    );

    const selectRoute = (routeId: string) => {
        setData('contract_route_id', routeId);

        const route = contractRoutes.find((r) => String(r.id) === routeId);
        if (!route) {
            return;
        }

        if (!isEditing) {
            setData('applied_price', String(route.price));
        }
        setData(
            'destination_id',
            route.destination_id ? String(route.destination_id) : '',
        );
        setCharges(chargesFromRoute(route));
    };

    const updateTrip = <K extends keyof TripRow>(
        key: string,
        field: K,
        value: TripRow[K],
    ) => {
        setTrips((current) =>
            current.map((trip) =>
                trip.key === key ? { ...trip, [field]: value } : trip,
            ),
        );
    };

    const changeTripTruckType = (key: string, truckType: string) => {
        setTrips((current) =>
            current.map((trip) => {
                if (trip.key !== key) {
                    return trip;
                }
                const currentTruck = trucks.find(
                    (t) => String(t.id) === trip.truck_id,
                );
                const stillValid =
                    !truckType || currentTruck?.vehicle_type === truckType;

                return {
                    ...trip,
                    truck_type: truckType,
                    truck_id: stillValid ? trip.truck_id : '',
                };
            }),
        );
    };

    const addTrip = () => {
        const last = trips[trips.length - 1];
        setTrips((current) => [
            ...current,
            emptyTrip(
                last?.planned_pickup_date ?? data.order_date,
                last?.planned_delivery_date ?? data.required_delivery_date,
            ),
        ]);
    };

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

    const appliedPriceNumber = parseFloat(data.applied_price) || 0;
    const contractRateNumber = selectedRoute?.price ?? 0;
    const isPriceOverridden =
        Boolean(selectedRoute) &&
        appliedPriceNumber > 0 &&
        Math.round(appliedPriceNumber * 100) !==
            Math.round(contractRateNumber * 100);
    const priceDifference = appliedPriceNumber - contractRateNumber;

    const chargesTotal = charges
        .filter((charge) => charge.enabled)
        .reduce(
            (sum, charge) => sum + (parseFloat(charge.applied_price) || 0),
            0,
        );
    const truckTotal = trips.reduce(
        (sum, trip) => sum + (parseFloat(trip.truck_amount) || 0),
        0,
    );
    const orderTotal =
        appliedPriceNumber * trips.length + chargesTotal + truckTotal;

    const buildPayload = (confirmNow: boolean) => ({
        ...data,
        destination_id: data.destination_id || null,
        cargo_details: {
            description: data.cargo_description || undefined,
            quantity: data.cargo_quantity
                ? Number(data.cargo_quantity)
                : undefined,
            unit: data.cargo_unit || undefined,
            total_weight_kg: data.cargo_weight_kg
                ? Number(data.cargo_weight_kg)
                : undefined,
        },
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
            cargo_details: {
                description: trip.cargo_description || undefined,
                quantity: trip.cargo_quantity
                    ? Number(trip.cargo_quantity)
                    : undefined,
                unit: trip.cargo_unit || undefined,
                total_weight_kg: trip.cargo_weight_kg
                    ? Number(trip.cargo_weight_kg)
                    : undefined,
            },
        })),
        confirm_now: confirmNow,
    });

    const submit = (confirmNow: boolean) => {
        transform(() => buildPayload(confirmNow));

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

            <div className="flex flex-col space-y-6 p-4 pb-16">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title={
                            isEditing
                                ? `Edit Transport Order (${data.order_number})`
                                : 'New Transport Order'
                        }
                        description="Establish a shipment order containing multiple trips tied to an approved contract and route."
                    />

                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild disabled={processing}>
                            <Link
                                href={index({ current_company: companySlug })}
                            >
                                Cancel
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={() => submit(false)}
                        >
                            Save as Draft
                        </Button>
                        <Button
                            type="button"
                            disabled={processing}
                            onClick={() => submit(true)}
                        >
                            Confirm Order
                        </Button>
                    </div>
                </div>

                {/* Section A: Order Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Section A: Order Details</CardTitle>
                        <CardDescription>
                            Define basic shipment identification and scheduling
                            dates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-2">
                            <Label>Order Number</Label>
                            <Input
                                value={data.order_number}
                                onChange={(e) =>
                                    setData('order_number', e.target.value)
                                }
                                placeholder="e.g. TO-2026-0001"
                                disabled={isEditing}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique order code for this company.
                            </p>
                            <InputError message={fieldErrors.order_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Order Date</Label>
                            <Input
                                type="date"
                                value={data.order_date}
                                onChange={(e) => {
                                    setData('order_date', e.target.value);
                                    if (
                                        data.required_delivery_date <
                                        e.target.value
                                    ) {
                                        setData(
                                            'required_delivery_date',
                                            e.target.value,
                                        );
                                    }
                                }}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Contract must be active on this date.
                            </p>
                            <InputError message={fieldErrors.order_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Required Delivery Date</Label>
                            <Input
                                type="date"
                                min={data.order_date}
                                value={data.required_delivery_date}
                                onChange={(e) =>
                                    setData(
                                        'required_delivery_date',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Must be on or after Order Date.
                            </p>
                            <InputError
                                message={fieldErrors.required_delivery_date}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Customer PO Number</Label>
                            <Input
                                value={data.customer_po_number}
                                onChange={(e) =>
                                    setData(
                                        'customer_po_number',
                                        e.target.value,
                                    )
                                }
                                placeholder="e.g. PO-98421"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Customer reference / purchase order.
                            </p>
                            <InputError
                                message={fieldErrors.customer_po_number}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section B: Customer & Contract Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Section B: Customer & Contract Selection
                        </CardTitle>
                        <CardDescription>
                            Link the order to an approved active customer
                            contract.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                                    <SelectValue placeholder="Select active customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem
                                            key={customer.id}
                                            value={String(customer.id)}
                                        >
                                            {customer.name} (CR:{' '}
                                            {customer.cr_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={fieldErrors.customer_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Active Contract</Label>
                            <Select
                                value={data.contract_id}
                                onValueChange={(value) => {
                                    setData('contract_id', value);
                                    setData('contract_route_id', '');
                                }}
                                disabled={
                                    !data.customer_id ||
                                    customerContracts.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            !data.customer_id
                                                ? 'Select customer first'
                                                : 'Select contract'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {customerContracts.map((contract) => (
                                        <SelectItem
                                            key={contract.id}
                                            value={String(contract.id)}
                                        >
                                            {contract.contract_number} (Exp:{' '}
                                            {contract.expiry_date})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Must be ACTIVE and valid on {data.order_date}.
                            </p>
                            <InputError message={fieldErrors.contract_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Contract Route</Label>
                            <Select
                                value={data.contract_route_id}
                                onValueChange={selectRoute}
                                disabled={
                                    !data.contract_id ||
                                    contractRoutes.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            !data.contract_id
                                                ? 'Select contract first'
                                                : 'Select route'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {contractRoutes.map((route) => (
                                        <SelectItem
                                            key={route.id}
                                            value={String(route.id)}
                                        >
                                            {route.from_city} &rarr;{' '}
                                            {route.to_city} (
                                            {route.vehicle_type}) - SAR{' '}
                                            {money(route.price)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Inherits origin, destination, vehicle & tariff.
                            </p>
                            <InputError
                                message={fieldErrors.contract_route_id}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section C: Selected Contract Route */}
                {selectedRoute ? (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle>
                                Section C: Selected Contract Route
                            </CardTitle>
                            <CardDescription>
                                Agreed transport parameters governed by the
                                contract.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-5">
                                <div>
                                    <span className="block text-[11px] tracking-wider text-muted-foreground uppercase">
                                        Origin City
                                    </span>
                                    <span className="text-sm font-bold">
                                        {selectedRoute.from_city}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[11px] tracking-wider text-muted-foreground uppercase">
                                        Destination City
                                    </span>
                                    <span className="text-sm font-bold">
                                        {selectedRoute.to_city}
                                    </span>
                                </div>
                                <div>
                                    <Label className="mb-1 block text-[11px] tracking-wider text-muted-foreground uppercase">
                                        Destination Name
                                    </Label>
                                    <Select
                                        value={data.destination_id || undefined}
                                        onValueChange={(value) =>
                                            setData('destination_id', value)
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-full">
                                            <SelectValue placeholder="None (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map((destination) => (
                                                <SelectItem
                                                    key={destination.id}
                                                    value={String(
                                                        destination.id,
                                                    )}
                                                >
                                                    {destination.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedDestination ? (
                                        <a
                                            href={
                                                selectedDestination.google_maps_url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                        >
                                            <MapPin className="h-3 w-3" />
                                            Open Google Maps
                                            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                                        </a>
                                    ) : null}
                                </div>
                                <div>
                                    <span className="block text-[11px] tracking-wider text-muted-foreground uppercase">
                                        Vehicle Type
                                    </span>
                                    <span className="flex items-center gap-1.5 text-sm font-bold">
                                        <Truck className="h-4 w-4 text-primary" />
                                        {selectedRoute.vehicle_type}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[11px] tracking-wider text-muted-foreground uppercase">
                                        Contract Rate
                                    </span>
                                    <span className="font-mono text-sm font-bold text-primary">
                                        SAR {money(selectedRoute.price)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                                    <div>
                                        <h4 className="text-xs font-bold tracking-wider uppercase">
                                            Optional Contractual Charges
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            Agreed contractual charges
                                            applicable once per transport order.
                                            Check to include in order total.
                                        </p>
                                    </div>
                                    {chargesTotal > 0 ? (
                                        <div className="text-left sm:text-right">
                                            <span className="block text-[10px] tracking-wider text-muted-foreground uppercase">
                                                Charges Subtotal
                                            </span>
                                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                + SAR {money(chargesTotal)}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="overflow-x-auto rounded-xl border bg-card">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                <th className="w-16 px-3 py-2.5 text-center">
                                                    Select
                                                </th>
                                                <th className="px-4 py-2.5">
                                                    Charge
                                                </th>
                                                <th className="px-4 py-2.5 text-right">
                                                    Contract Amount
                                                </th>
                                                <th className="px-4 py-2.5 text-right">
                                                    Applied Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {charges.map((charge) => (
                                                <tr
                                                    key={charge.type}
                                                    className={
                                                        charge.enabled
                                                            ? 'bg-primary/5'
                                                            : ''
                                                    }
                                                >
                                                    <td className="px-3 py-2.5 text-center">
                                                        <Checkbox
                                                            checked={
                                                                charge.enabled
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                updateCharge(
                                                                    charge.type,
                                                                    'enabled',
                                                                    Boolean(
                                                                        checked,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="font-semibold">
                                                            {charge.label}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {charge.description}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                                                        {charge.contract_price}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={
                                                                charge.applied_price
                                                            }
                                                            onChange={(e) =>
                                                                updateCharge(
                                                                    charge.type,
                                                                    'applied_price',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="ml-auto w-32 text-right font-mono"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Section D: Pricing & Override */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Section D: Pricing & Authorized Override
                        </CardTitle>
                        <CardDescription>
                            Applied rate per trip and authorization controls.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
                            <div className="rounded-lg border bg-muted/40 p-3">
                                <span className="block text-[11px] tracking-wider text-muted-foreground uppercase">
                                    Contract Tariff (Per Trip)
                                </span>
                                <div className="font-mono text-base font-bold">
                                    {selectedRoute
                                        ? `SAR ${money(selectedRoute.price)}`
                                        : '—'}
                                </div>
                                <span className="mt-1 block text-[10px] text-muted-foreground">
                                    Default contractual rate.
                                </span>
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Applied Rate (SAR)</Label>
                                    {isPriceOverridden ? (
                                        <span className="text-[10px] font-bold text-amber-600 uppercase dark:text-amber-400">
                                            Override Active
                                        </span>
                                    ) : null}
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={data.applied_price}
                                    onChange={(e) =>
                                        setData('applied_price', e.target.value)
                                    }
                                    disabled={
                                        !canOverridePrice || !selectedRoute
                                    }
                                    required
                                    className="font-mono font-bold"
                                />
                                {!canOverridePrice ? (
                                    <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                        <ShieldAlert className="h-3 w-3 shrink-0" />
                                        Only Admin or Operations Manager can
                                        override the contract price.
                                    </p>
                                ) : null}
                                <InputError
                                    message={fieldErrors.applied_price}
                                />
                            </div>

                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                                <span className="block text-[11px] font-semibold tracking-wider text-primary uppercase">
                                    Order Total ({trips.length}{' '}
                                    {trips.length === 1 ? 'Trip' : 'Trips'})
                                </span>
                                <div className="font-mono text-lg font-bold">
                                    SAR {money(orderTotal)}
                                </div>
                                <div className="mt-0.5 space-y-0.5 text-[10px] text-muted-foreground">
                                    <div>
                                        Base: {trips.length} &times; SAR{' '}
                                        {money(appliedPriceNumber)}
                                    </div>
                                    {chargesTotal > 0 ? (
                                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            + Tariffs: SAR {money(chargesTotal)}
                                        </div>
                                    ) : null}
                                    {truckTotal > 0 ? (
                                        <div className="font-semibold text-primary">
                                            + Truck Charges: SAR{' '}
                                            {money(truckTotal)}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {isPriceOverridden ? (
                            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/80 dark:bg-amber-950/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        Authorized Price Override Notice
                                    </div>
                                    <div className="font-mono text-xs font-bold">
                                        Variance:{' '}
                                        <span
                                            className={
                                                priceDifference > 0
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : 'text-rose-700 dark:text-rose-400'
                                            }
                                        >
                                            {priceDifference > 0 ? '+' : ''}
                                            {money(priceDifference)} / trip
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>
                                        Override Justification / Reason
                                    </Label>
                                    <Input
                                        value={data.override_reason}
                                        onChange={(e) =>
                                            setData(
                                                'override_reason',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. Urgent weekend delivery premium agreed with client..."
                                        className="bg-background"
                                    />
                                    <InputError
                                        message={fieldErrors.override_reason}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Section E: Transport Trips Schedule */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>
                                Section E: Transport Trips Schedule
                            </CardTitle>
                            <CardDescription>
                                Plan independent schedule for all {trips.length}{' '}
                                transport trip execution units.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InputError message={fieldErrors.trips} />

                        {trips.map((trip, idx) => {
                            const tripNumberPreview = data.order_number
                                ? `${data.order_number}-TRIP-${String(idx + 1).padStart(3, '0')}`
                                : `TRIP-${String(idx + 1).padStart(3, '0')}`;

                            return (
                                <div
                                    key={trip.key}
                                    data-test="order-trip-row"
                                    className="space-y-3 rounded-xl border p-3.5"
                                >
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {idx + 1}
                                            </span>
                                            <span className="font-mono text-xs font-bold">
                                                {tripNumberPreview}
                                            </span>
                                            {selectedRoute ? (
                                                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                                                    ({selectedRoute.from_city}{' '}
                                                    &rarr;{' '}
                                                    {selectedRoute.to_city})
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-semibold">
                                                SAR {money(appliedPriceNumber)}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    removeTrip(trip.key)
                                                }
                                                disabled={trips.length <= 1}
                                                title={
                                                    trips.length <= 1
                                                        ? 'Minimum 1 trip required'
                                                        : 'Remove trip'
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="grid gap-1">
                                            <Label className="text-xs">
                                                Planned Pickup Date
                                            </Label>
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
                                                        `trips.${idx}.planned_pickup_date`
                                                    ]
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-1">
                                            <Label className="text-xs">
                                                Planned Delivery Date
                                            </Label>
                                            <Input
                                                type="date"
                                                min={trip.planned_pickup_date}
                                                value={
                                                    trip.planned_delivery_date
                                                }
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
                                                        `trips.${idx}.planned_delivery_date`
                                                    ]
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-1">
                                            <Label className="text-xs">
                                                Trip Special Notes / Ref
                                            </Label>
                                            <Input
                                                value={trip.special_notes}
                                                onChange={(e) =>
                                                    updateTrip(
                                                        trip.key,
                                                        'special_notes',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g. Morning slot, Gate 2..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t pt-2.5">
                                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                            <Truck className="h-3.5 w-3.5" />
                                            Truck & Driver Assignment (Optional)
                                        </span>
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                            <div className="grid gap-1">
                                                <Label className="text-[10px] text-muted-foreground">
                                                    Driver
                                                </Label>
                                                <Select
                                                    value={
                                                        trip.driver_id ||
                                                        undefined
                                                    }
                                                    onValueChange={(value) =>
                                                        updateTrip(
                                                            trip.key,
                                                            'driver_id',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {drivers.map(
                                                            (driver) => (
                                                                <SelectItem
                                                                    key={
                                                                        driver.id
                                                                    }
                                                                    value={String(
                                                                        driver.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        driver.first_name
                                                                    }{' '}
                                                                    {
                                                                        driver.last_name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-1">
                                                <Label className="text-[10px] text-muted-foreground">
                                                    Truck Type
                                                </Label>
                                                <Select
                                                    value={
                                                        trip.truck_type ||
                                                        undefined
                                                    }
                                                    onValueChange={(value) =>
                                                        changeTripTruckType(
                                                            trip.key,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Types" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TANKER">
                                                            Tanker
                                                        </SelectItem>
                                                        <SelectItem value="TRUCK">
                                                            Truck
                                                        </SelectItem>
                                                        <SelectItem value="LORRY">
                                                            Lorry
                                                        </SelectItem>
                                                        <SelectItem value="DYANA">
                                                            Dyana
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-1">
                                                <Label className="text-[10px] text-muted-foreground">
                                                    Plate Number
                                                </Label>
                                                <Select
                                                    value={
                                                        trip.truck_id ||
                                                        undefined
                                                    }
                                                    onValueChange={(value) =>
                                                        updateTrip(
                                                            trip.key,
                                                            'truck_id',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="font-mono">
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {trucks
                                                            .filter(
                                                                (truck) =>
                                                                    !trip.truck_type ||
                                                                    truck.vehicle_type ===
                                                                        trip.truck_type,
                                                            )
                                                            .map((truck) => (
                                                                <SelectItem
                                                                    key={
                                                                        truck.id
                                                                    }
                                                                    value={String(
                                                                        truck.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        truck.license_plate
                                                                    }
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-1">
                                                <Label className="text-[10px] text-muted-foreground">
                                                    Truck Amount (SAR)
                                                </Label>
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
                                                    className="text-right font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t pt-2.5">
                                        <span className="text-[11px] font-medium text-muted-foreground">
                                            Trip-Specific Cargo (Optional —
                                            independent per trip)
                                        </span>
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                                            <div className="grid gap-1 sm:col-span-2">
                                                <Label className="text-[10px] text-muted-foreground">
                                                    Cargo Description
                                                </Label>
                                                <Input
                                                    value={
                                                        trip.cargo_description
                                                    }
                                                    onChange={(e) =>
                                                        updateTrip(
                                                            trip.key,
                                                            'cargo_description',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. Specific consignment for this trip..."
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-[10px] text-muted-foreground">
                                                    Quantity & Unit
                                                </Label>
                                                <div className="flex gap-1.5">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                            trip.cargo_quantity
                                                        }
                                                        onChange={(e) =>
                                                            updateTrip(
                                                                trip.key,
                                                                'cargo_quantity',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Qty"
                                                        className="w-1/2"
                                                    />
                                                    <Select
                                                        value={trip.cargo_unit}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateTrip(
                                                                trip.key,
                                                                'cargo_unit',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-1/2">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Pallets">
                                                                Pallets
                                                            </SelectItem>
                                                            <SelectItem value="Tons">
                                                                Tons
                                                            </SelectItem>
                                                            <SelectItem value="Boxes">
                                                                Boxes
                                                            </SelectItem>
                                                            <SelectItem value="Units">
                                                                Units
                                                            </SelectItem>
                                                            <SelectItem value="Cartons">
                                                                Cartons
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-[10px] text-muted-foreground">
                                                    Weight (KG)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={trip.cargo_weight_kg}
                                                    onChange={(e) =>
                                                        updateTrip(
                                                            trip.key,
                                                            'cargo_weight_kg',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Weight (KG)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addTrip}
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Another Trip
                        </Button>
                    </CardContent>
                </Card>

                {/* Section F: Cargo Details & Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Section F: Cargo Details & Instructions
                        </CardTitle>
                        <CardDescription>
                            Cargo specifications and facility instructions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Cargo Description</Label>
                                <Input
                                    value={data.cargo_description}
                                    onChange={(e) =>
                                        setData(
                                            'cargo_description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Dry food products, steel pipes, electronics..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Quantity & Unit</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        value={data.cargo_quantity}
                                        onChange={(e) =>
                                            setData(
                                                'cargo_quantity',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Qty"
                                        className="w-1/2"
                                    />
                                    <Select
                                        value={data.cargo_unit}
                                        onValueChange={(value) =>
                                            setData('cargo_unit', value)
                                        }
                                    >
                                        <SelectTrigger className="w-1/2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pallets">
                                                Pallets
                                            </SelectItem>
                                            <SelectItem value="Tons">
                                                Tons
                                            </SelectItem>
                                            <SelectItem value="Boxes">
                                                Boxes
                                            </SelectItem>
                                            <SelectItem value="Units">
                                                Units
                                            </SelectItem>
                                            <SelectItem value="Cartons">
                                                Cartons
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Weight (KG)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={data.cargo_weight_kg}
                                    onChange={(e) =>
                                        setData(
                                            'cargo_weight_kg',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label>Loading Instructions</Label>
                                <Textarea
                                    value={data.loading_instructions}
                                    onChange={(e) =>
                                        setData(
                                            'loading_instructions',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Delivery Instructions</Label>
                                <Textarea
                                    value={data.delivery_instructions}
                                    onChange={(e) =>
                                        setData(
                                            'delivery_instructions',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Internal Remarks</Label>
                                <Textarea
                                    value={data.internal_remarks}
                                    onChange={(e) =>
                                        setData(
                                            'internal_remarks',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild disabled={processing}>
                        <Link href={index({ current_company: companySlug })}>
                            Cancel
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={processing}
                        onClick={() => submit(false)}
                    >
                        Save as Draft
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={() => submit(true)}
                    >
                        Confirm Order
                    </Button>
                </div>
            </div>
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
