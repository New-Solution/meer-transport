<?php

namespace App\Http\Controllers;

use App\Http\Requests\Destinations\StoreDestinationRequest;
use App\Http\Requests\Destinations\UpdateDestinationRequest;
use App\Models\Company;
use App\Models\Destination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DestinationController extends Controller
{
    public function index(Company $current_company): Response
    {
        Gate::authorize('viewAny', Destination::class);

        return Inertia::render('destinations/index', [
            'destinations' => Destination::query()
                ->orderBy('name')
                ->get(['id', 'name', 'google_maps_url']),
        ]);
    }

    public function store(StoreDestinationRequest $request, Company $current_company): RedirectResponse
    {
        Destination::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Destination created.')]);

        return back();
    }

    public function update(UpdateDestinationRequest $request, Company $current_company, Destination $destination): RedirectResponse
    {
        $destination->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Destination updated.')]);

        return back();
    }

    public function destroy(Company $current_company, Destination $destination): RedirectResponse
    {
        Gate::authorize('delete', $destination);

        if ($destination->contractRoutes()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('This destination cannot be deleted because it is used by contract routes.'),
            ]);

            return back();
        }

        $destination->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Destination deleted.')]);

        return back();
    }
}
