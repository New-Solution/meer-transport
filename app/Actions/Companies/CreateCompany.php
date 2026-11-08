<?php

namespace App\Actions\Companies;

use App\Enums\BusinessRole;
use App\Enums\CompanyRole;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateCompany
{
    /**
     * Create a new company and add the user as owner.
     */
    public function handle(User $user, string $name, bool $isPersonal = false): Company
    {
        return DB::transaction(function () use ($user, $name, $isPersonal) {
            $company = Company::create([
                'name' => $name,
                'is_personal' => $isPersonal,
            ]);

            $membership = $company->memberships()->create([
                'user_id' => $user->id,
                'role' => CompanyRole::Owner,
                'business_role' => BusinessRole::Admin,
            ]);

            $user->switchCompany($company);

            return $company;
        });
    }
}
