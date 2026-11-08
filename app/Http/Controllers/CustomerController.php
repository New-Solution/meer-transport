<?php

namespace App\Http\Controllers;

use App\Http\Requests\Customers\StoreCustomerRequest;
use App\Http\Requests\Customers\UpdateCustomerRequest;
use App\Models\Company;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request, Company $current_company): Response
    {
        Gate::authorize('viewAny', Customer::class);

        $query = Customer::query();

        if (! $request->boolean('include_archived')) {
            $query->active();
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('cr_number', 'like', "%{$search}%")
                    ->orWhere('unified_number', 'like', "%{$search}%")
                    ->orWhere('vat_number', 'like', "%{$search}%");
            });
        }

        return Inertia::render('customers/index', [
            'customers' => $query->orderBy('name')->get(),
            'filters' => [
                'search' => $search ?: '',
                'includeArchived' => $request->boolean('include_archived'),
            ],
        ]);
    }

    public function store(StoreCustomerRequest $request, Company $current_company): RedirectResponse
    {
        Customer::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer created.')]);

        return back();
    }

    public function update(UpdateCustomerRequest $request, Company $current_company, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer updated.')]);

        return back();
    }

    public function archive(Company $current_company, Customer $customer): RedirectResponse
    {
        Gate::authorize('update', $customer);

        $customer->update(['archived_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer archived.')]);

        return back();
    }

    public function restore(Company $current_company, Customer $customer): RedirectResponse
    {
        Gate::authorize('update', $customer);

        $customer->update(['archived_at' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer restored.')]);

        return back();
    }

    public function destroy(Company $current_company, Customer $customer): RedirectResponse
    {
        Gate::authorize('delete', $customer);

        if ($customer->contracts()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This customer cannot be deleted because it has contracts. Archive it instead.'),
            ]);

            return back();
        }

        $customer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer deleted.')]);

        return back();
    }
}
