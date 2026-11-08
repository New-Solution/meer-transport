<?php

use App\Models\CompanyInvitation;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    CompanyInvitation::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->delete();
})->daily()->description('Delete expired company invitations');
