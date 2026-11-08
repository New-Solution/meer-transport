<?php

namespace App\Http\Controllers;

use App\Http\Requests\Trucks\StoreTruckRequest;
use App\Http\Requests\Trucks\UpdateTruckRequest;
use App\Models\Company;
use App\Models\Truck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TruckController extends Controller
{
    public function index(Request $request, Company $current_company): Response
    {
        Gate::authorize('viewAny', Truck::class);

        $query = Truck::query();

        if ($weightType = $request->string('weight_type')->toString()) {
            $query->where('weight_type', $weightType);
        }

        if ($vehicleType = $request->string('vehicle_type')->toString()) {
            $query->where('vehicle_type', $vehicleType);
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where('license_plate', 'like', "%{$search}%");
        }

        return Inertia::render('trucks/index', [
            'trucks' => $query->latest()->get(),
            'filters' => [
                'search' => $search ?: '',
                'weightType' => $weightType ?: '',
                'vehicleType' => $vehicleType ?: '',
            ],
        ]);
    }

    public function store(StoreTruckRequest $request, Company $current_company): RedirectResponse
    {
        Truck::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Truck added.')]);

        return back();
    }

    public function update(UpdateTruckRequest $request, Company $current_company, Truck $truck): RedirectResponse
    {
        $truck->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Truck updated.')]);

        return back();
    }

    public function destroy(Company $current_company, Truck $truck): RedirectResponse
    {
        Gate::authorize('delete', $truck);

        if ($truck->trips()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This truck cannot be deleted because it is linked to existing transport trips.'),
            ]);

            return back();
        }

        $truck->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Truck deleted.')]);

        return back();
    }
}
