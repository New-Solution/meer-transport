import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import { index, store, update } from '@/routes/contracts';
import type {
    Company,
    ContractCustomerOption,
    ContractDestinationOption,
    ContractDetail,
} from '@/types';

type RouteRow = {
    key: string;
    id?: number;
    from_city: string;
    to_city: string;
    destination_id: string;
    price: string;
    return_price: string;
    stay_price: string;
    stop_price: string;
    additional_price: string;
};

type Props = {
    contract: ContractDetail | null;
    customers: ContractCustomerOption[];
    destinations: ContractDestinationOption[];
    currentCompany: Company;
};

function emptyRoute(): RouteRow {
    return {
        key: crypto.randomUUID(),
        from_city: '',
        to_city: '',
        destination_id: '',
        price: '',
        return_price: '',
        stay_price: '',
        stop_price: '',
        additional_price: '',
    };
}

export default function ContractForm({
    contract,
    customers,
    destinations,
    currentCompany,
}: Props) {
    const isEditing = Boolean(contract);
    const companySlug = currentCompany.slug;

    const today = new Date().toISOString().slice(0, 10);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const [routes, setRoutes] = useState<RouteRow[]>(
        contract
            ? contract.routes.map((route) => ({
                  key: String(route.id),
                  id: route.id,
                  from_city: route.from_city,
                  to_city: route.to_city,
                  destination_id: route.destination_id
                      ? String(route.destination_id)
                      : '',
                  price: String(route.price),
                  return_price: String(route.return_price),
                  stay_price: String(route.stay_price),
                  stop_price: String(route.stop_price),
                  additional_price: String(route.additional_price),
              }))
            : [emptyRoute()],
    );

    const { data, setData, post, put, processing, errors, transform } = useForm(
        {
            contract_number: contract?.contract_number ?? '',
            customer_id: contract ? String(contract.customer_id) : '',
            contract_date: contract?.contract_date ?? today,
            expiry_date:
                contract?.expiry_date ??
                oneYearFromNow.toISOString().slice(0, 10),
            status: 'ACTIVE',
        },
    );

    const updateRoute = (key: string, field: keyof RouteRow, value: string) => {
        setRoutes((current) =>
            current.map((route) =>
                route.key === key ? { ...route, [field]: value } : route,
            ),
        );
    };

    const addRoute = () => setRoutes((current) => [...current, emptyRoute()]);

    const removeRoute = (key: string) =>
        setRoutes((current) =>
            current.length > 1
                ? current.filter((route) => route.key !== key)
                : current,
        );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((currentData) => ({
            ...currentData,
            routes: routes.map((route) => ({
                id: route.id,
                from_city: route.from_city,
                to_city: route.to_city,
                destination_id: route.destination_id || null,
                vehicle_type: 'Truck',
                price: route.price,
                return_price: route.return_price || '0',
                stay_price: route.stay_price || '0',
                stop_price: route.stop_price || '0',
                additional_price: route.additional_price || '0',
            })),
        }));

        if (isEditing && contract) {
            put(
                update.url({
                    current_company: companySlug,
                    contract: contract.id,
                }),
            );
        } else {
            post(store.url({ current_company: companySlug }));
        }
    };

    const routeErrors = errors as Record<string, string>;

    return (
        <>
            <Head title={isEditing ? 'Edit Contract' : 'New Contract'} />

            <form
                onSubmit={handleSubmit}
                className="flex flex-col space-y-6 p-4"
            >
                <Heading
                    title={isEditing ? 'Edit contract' : 'New contract'}
                    description="A contract defines the customer, validity window, and agreed route tariffs."
                />

                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
                    <div className="grid gap-2">
                        <Label htmlFor="contract_number">Contract number</Label>
                        <Input
                            id="contract_number"
                            value={data.contract_number}
                            onChange={(e) =>
                                setData('contract_number', e.target.value)
                            }
                            placeholder="e.g. TC-2026-0001"
                            required
                        />
                        <InputError message={errors.contract_number} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="customer_id">Customer</Label>
                        <Select
                            value={data.customer_id}
                            onValueChange={(value) =>
                                setData('customer_id', value)
                            }
                        >
                            <SelectTrigger id="customer_id">
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
                        <InputError message={errors.customer_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="contract_date">Contract date</Label>
                        <Input
                            id="contract_date"
                            type="date"
                            value={data.contract_date}
                            onChange={(e) =>
                                setData('contract_date', e.target.value)
                            }
                            required
                        />
                        <InputError message={errors.contract_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="expiry_date">Expiry date</Label>
                        <Input
                            id="expiry_date"
                            type="date"
                            value={data.expiry_date}
                            onChange={(e) =>
                                setData('expiry_date', e.target.value)
                            }
                            required
                        />
                        <InputError message={errors.expiry_date} />
                    </div>

                    {!isEditing ? (
                        <div className="grid gap-2">
                            <Label htmlFor="status">Initial status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    setData('status', value)
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <Heading
                            variant="small"
                            title="Routes"
                            description="Multi-route tariffs for this contract"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={addRoute}
                        >
                            <Plus /> Add route
                        </Button>
                    </div>
                    <InputError message={routeErrors.routes} />

                    {routes.map((route, routeIndex) => (
                        <div
                            key={route.key}
                            data-test="contract-route-row"
                            className="space-y-3 rounded-md border p-3"
                        >
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="grid gap-1">
                                    <Label>From city</Label>
                                    <Input
                                        value={route.from_city}
                                        onChange={(e) =>
                                            updateRoute(
                                                route.key,
                                                'from_city',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            routeErrors[
                                                `routes.${routeIndex}.from_city`
                                            ]
                                        }
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <Label>To city</Label>
                                    <Input
                                        value={route.to_city}
                                        onChange={(e) =>
                                            updateRoute(
                                                route.key,
                                                'to_city',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            routeErrors[
                                                `routes.${routeIndex}.to_city`
                                            ]
                                        }
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <Label>Destination</Label>
                                    <Select
                                        value={route.destination_id}
                                        onValueChange={(value) =>
                                            updateRoute(
                                                route.key,
                                                'destination_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="None" />
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
                                </div>

                                <div className="grid gap-1">
                                    <Label>Price (SAR)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={route.price}
                                        onChange={(e) =>
                                            updateRoute(
                                                route.key,
                                                'price',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            routeErrors[
                                                `routes.${routeIndex}.price`
                                            ]
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                <div className="grid gap-1">
                                    <Label>Return price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={route.return_price}
                                        onChange={(e) =>
                                            updateRoute(
                                                route.key,
                                                'return_price',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <Label>Stay price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={route.stay_price}
                                        onChange={(e) =>
                                            updateRoute(
                                                route.key,
                                                'stay_price',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <Label>Stop price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={route.stop_price}
                                        onChange={(e) =>
                                            updateRoute(
                                                route.key,
                                                'stop_price',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <Label>Additional price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={route.additional_price}
                                        onChange={(e) =>
                                            updateRoute(
                                                route.key,
                                                'additional_price',
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
                                        onClick={() => removeRoute(route.key)}
                                        disabled={routes.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" /> Remove
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={processing}>
                        {isEditing ? 'Save changes' : 'Create contract'}
                    </Button>
                </div>
            </form>
        </>
    );
}

ContractForm.layout = (props: { currentCompany?: Company | null }) => ({
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
