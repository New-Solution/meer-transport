<?php

namespace App\Http\Controllers;

use App\Http\Requests\Drivers\StoreDriverRequest;
use App\Http\Requests\Drivers\UpdateDriverRequest;
use App\Models\Company;
use App\Models\Driver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DriverController extends Controller
{
    public function index(Request $request, Company $current_company): Response
    {
        Gate::authorize('viewAny', Driver::class);

        $query = Driver::query();

        if ($nationality = $request->string('nationality')->toString()) {
            $query->where('nationality', $nationality);
        }

        if ($homeCity = $request->string('home_city')->toString()) {
            $query->where('home_city', $homeCity);
        }

        $this->applyExpiryFilter($query, 'license_expiry', $request->string('license_status')->toString());
        $this->applyExpiryFilter($query, 'id_iqama_expiry', $request->string('id_iqama_status')->toString());

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($query) use ($search) {
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('license_no', 'like', "%{$search}%")
                    ->orWhere('saudi_id_iqama_no', 'like', "%{$search}%")
                    ->orWhere('mobile_phone_1', 'like', "%{$search}%")
                    ->orWhere('mobile_phone_2', 'like', "%{$search}%");
            });
        }

        return Inertia::render('drivers/index', [
            'drivers' => $query->latest()->get(),
            'filters' => [
                'search' => $search ?: '',
                'nationality' => $nationality ?: '',
                'homeCity' => $homeCity ?: '',
                'licenseStatus' => $request->string('license_status')->toString() ?: '',
                'idIqamaStatus' => $request->string('id_iqama_status')->toString() ?: '',
            ],
        ]);
    }

    /**
     * @param  Builder<Driver>  $query
     */
    private function applyExpiryFilter(Builder $query, string $column, string $status): void
    {
        $today = Carbon::today();

        match ($status) {
            'EXPIRED' => $query->whereNotNull($column)->whereDate($column, '<', $today),
            'EXPIRING_SOON' => $query->whereNotNull($column)
                ->whereDate($column, '>=', $today)
                ->whereDate($column, '<=', $today->copy()->addDays(30)),
            'VALID' => $query->whereNotNull($column)->whereDate($column, '>', $today->copy()->addDays(30)),
            default => null,
        };
    }

    public function store(StoreDriverRequest $request, Company $current_company): RedirectResponse
    {
        Driver::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Driver added.')]);

        return back();
    }

    public function update(UpdateDriverRequest $request, Company $current_company, Driver $driver): RedirectResponse
    {
        $driver->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Driver updated.')]);

        return back();
    }

    public function destroy(Company $current_company, Driver $driver): RedirectResponse
    {
        Gate::authorize('delete', $driver);

        if ($driver->trips()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This driver cannot be deleted because they are linked to existing transport trips.'),
            ]);

            return back();
        }

        $driver->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Driver deleted.')]);

        return back();
    }
}
