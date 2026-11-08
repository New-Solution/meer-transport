<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    public function index(Company $current_company): Response
    {
        Gate::authorize('viewPricing');

        return Inertia::render('pricing/index');
    }
}
