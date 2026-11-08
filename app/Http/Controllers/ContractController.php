<?php

namespace App\Http\Controllers;

use App\Actions\Contracts\ActivateContract;
use App\Actions\Contracts\CancelContract;
use App\Actions\Contracts\CreateContract;
use App\Actions\Contracts\UpdateContract;
use App\Enums\ContractStatus;
use App\Http\Requests\Contracts\StoreContractRequest;
use App\Http\Requests\Contracts\UpdateContractRequest;
use App\Models\Company;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Destination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ContractController extends Controller
{
    public function index(Request $request, Company $current_company): Response
    {
        Gate::authorize('viewAny', Contract::class);

        $query = Contract::query()->with('customer')->whereNull('archived_at');

        if ($customerId = $request->integer('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($query) use ($search) {
                $query->where('contract_number', 'like', "%{$search}%")
                    ->orWhereRaw("JSON_EXTRACT(customer_snapshot, '$.name') LIKE ?", ["%{$search}%"]);
            });
        }

        $contracts = $query->latest('contract_date')->get();

        $status = $request->string('status')->toString();
        if ($status) {
            $contracts = $contracts->filter(fn (Contract $contract) => $contract->resolvedStatus()->value === $status)->values();
        }

        return Inertia::render('contracts/index', [
            'contracts' => $contracts->map($this->toListItem(...)),
            'filters' => [
                'search' => $search ?: '',
                'status' => $status ?: '',
                'customerId' => $customerId ?: null,
            ],
        ]);
    }

    public function create(Company $current_company): Response
    {
        Gate::authorize('create', Contract::class);

        return Inertia::render('contracts/form', [
            'contract' => null,
            'customers' => Customer::query()->active()->orderBy('name')->get(['id', 'name', 'cr_number']),
            'destinations' => Destination::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreContractRequest $request, Company $current_company, CreateContract $createContract): RedirectResponse
    {
        $contract = $createContract->handle($request->safe()->except('routes'), $request->normalizedRoutes());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contract created.')]);

        return to_route('contracts.show', ['current_company' => $current_company->slug, 'contract' => $contract->id]);
    }

    public function show(Company $current_company, Contract $contract): Response
    {
        Gate::authorize('view', $contract);

        $contract->load(['customer', 'routes.destination']);

        return Inertia::render('contracts/show', [
            'contract' => $this->toDetail($contract),
        ]);
    }

    public function edit(Company $current_company, Contract $contract): Response
    {
        Gate::authorize('update', $contract);

        $contract->load('routes');

        return Inertia::render('contracts/form', [
            'contract' => $this->toDetail($contract),
            'customers' => Customer::query()->active()->orderBy('name')->get(['id', 'name', 'cr_number']),
            'destinations' => Destination::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateContractRequest $request, Company $current_company, Contract $contract, UpdateContract $updateContract): RedirectResponse
    {
        $updateContract->handle($contract, $request->safe()->except('routes'), $request->normalizedRoutes());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contract updated.')]);

        return to_route('contracts.show', ['current_company' => $current_company->slug, 'contract' => $contract->id]);
    }

    public function activate(Company $current_company, Contract $contract, ActivateContract $activateContract): RedirectResponse
    {
        Gate::authorize('update', $contract);

        try {
            $activateContract->handle($contract);
        } catch (RuntimeException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contract activated.')]);

        return back();
    }

    public function cancel(Request $request, Company $current_company, Contract $contract, CancelContract $cancelContract): RedirectResponse
    {
        Gate::authorize('update', $contract);

        try {
            $cancelContract->handle($contract, $request->user()->name, $request->string('reason')->toString());
        } catch (RuntimeException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contract cancelled.')]);

        return back();
    }

    public function archive(Company $current_company, Contract $contract): RedirectResponse
    {
        Gate::authorize('update', $contract);

        $contract->update(['archived_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contract archived.')]);

        return to_route('contracts.index', ['current_company' => $current_company->slug]);
    }

    public function destroy(Company $current_company, Contract $contract): RedirectResponse
    {
        Gate::authorize('delete', $contract);

        if ($contract->resolvedStatus() !== ContractStatus::Draft) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Only DRAFT contracts can be permanently deleted. Use Archive or Cancel instead.'),
            ]);

            return back();
        }

        $contract->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contract deleted.')]);

        return to_route('contracts.index', ['current_company' => $current_company->slug]);
    }

    /**
     * @return array<string, mixed>
     */
    private function toListItem(Contract $contract): array
    {
        return [
            'id' => $contract->id,
            'contract_number' => $contract->contract_number,
            'customer_name' => $contract->customer_snapshot['name'],
            'contract_date' => $contract->contract_date->toDateString(),
            'expiry_date' => $contract->expiry_date->toDateString(),
            'status' => $contract->resolvedStatus()->value,
            'routes_count' => $contract->routes()->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toDetail(Contract $contract): array
    {
        return [
            'id' => $contract->id,
            'contract_number' => $contract->contract_number,
            'customer_id' => $contract->customer_id,
            'customer_snapshot' => $contract->customer_snapshot,
            'contract_date' => $contract->contract_date->toDateString(),
            'expiry_date' => $contract->expiry_date->toDateString(),
            'status' => $contract->status->value,
            'resolved_status' => $contract->resolvedStatus()->value,
            'cancelled_at' => $contract->cancelled_at?->toIso8601String(),
            'cancelled_by' => $contract->cancelled_by,
            'cancellation_reason' => $contract->cancellation_reason,
            'archived_at' => $contract->archived_at?->toIso8601String(),
            'routes' => $contract->routes->map(fn ($route) => [
                'id' => $route->id,
                'from_city' => $route->from_city,
                'to_city' => $route->to_city,
                'destination_id' => $route->destination_id,
                'destination_name' => $route->destination?->name,
                'vehicle_type' => $route->vehicle_type,
                'price' => $route->price_halalas / 100,
                'return_price' => $route->return_price_halalas / 100,
                'stay_price' => $route->stay_price_halalas / 100,
                'stop_price' => $route->stop_price_halalas / 100,
                'additional_price' => $route->additional_price_halalas / 100,
            ]),
        ];
    }
}
