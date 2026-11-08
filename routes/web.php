<?php

use App\Http\Controllers\Companies\CompanyInvitationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Middleware\EnsureCompanyMembership;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::prefix('{current_company}')
    ->middleware(['auth', 'verified', EnsureCompanyMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        require __DIR__.'/operations.php';
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [CompanyInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [CompanyInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
