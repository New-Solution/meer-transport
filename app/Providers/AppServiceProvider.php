<?php

namespace App\Providers;

use App\Enums\BusinessPermission;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureBusinessGates();
    }

    /**
     * Gates for pages not backed by a single Eloquent model, where a
     * dedicated Policy class would be an empty wrapper around one check.
     */
    protected function configureBusinessGates(): void
    {
        Gate::define('viewPricing', fn (User $user) => $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::PricingManage));

        Gate::define('viewReports', fn (User $user) => $user->currentCompany
            && $user->hasBusinessPermission($user->currentCompany, BusinessPermission::ReportsView));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
