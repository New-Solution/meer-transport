<?php

use App\Http\Controllers\Companies\CompanyController;
use App\Http\Controllers\Companies\CompanyInvitationController;
use App\Http\Controllers\Companies\CompanyMemberController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Middleware\EnsureCompanyMembership;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::get('settings/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::post('settings/companies', [CompanyController::class, 'store'])->name('companies.store');

    Route::middleware(EnsureCompanyMembership::class)->group(function () {
        Route::get('settings/companies/{company}', [CompanyController::class, 'edit'])->name('companies.edit');
        Route::patch('settings/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
        Route::delete('settings/companies/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');
        Route::post('settings/companies/{company}/switch', [CompanyController::class, 'switch'])->name('companies.switch');
        Route::delete('settings/companies/{company}/leave', [CompanyController::class, 'leave'])->name('companies.leave');

        Route::patch('settings/companies/{company}/members/{user}', [CompanyMemberController::class, 'update'])->name('companies.members.update');
        Route::patch('settings/companies/{company}/members/{user}/business-role', [CompanyMemberController::class, 'updateBusinessRole'])->name('companies.members.updateBusinessRole');
        Route::delete('settings/companies/{company}/members/{user}', [CompanyMemberController::class, 'destroy'])->name('companies.members.destroy');

        Route::post('settings/companies/{company}/invitations', [CompanyInvitationController::class, 'store'])->name('companies.invitations.store');
        Route::delete('settings/companies/{company}/invitations/{invitation}', [CompanyInvitationController::class, 'destroy'])->name('companies.invitations.destroy');
    });
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
