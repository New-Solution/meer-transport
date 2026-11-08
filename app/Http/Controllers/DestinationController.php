<?php

namespace App\Http\Controllers;

use App\Http\Requests\Destinations\StoreDestinationRequest;
use App\Http\Requests\Destinations\UpdateDestinationRequest;
use App\Models\Company;
use App\Models\Destination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DestinationController extends Controller
{
    public function index(Request $request, Company $current_company): Response
    {
        Gate::authorize('viewAny', Destination::class);

        $query = Destination::query();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where('name', 'like', "%{$search}%");
        }

        return Inertia::render('destinations/index', [
            'destinations' => $query->orderBy('name')
                ->get(['id', 'name', 'google_maps_url', 'created_at'])
                ->map(fn (Destination $destination) => [
                    'id' => $destination->id,
                    'name' => $destination->name,
                    'google_maps_url' => $destination->google_maps_url,
                    'created_at' => $destination->created_at?->toDateString(),
                ]),
            'filters' => [
                'search' => $search ?: '',
            ],
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
