<?php

namespace App\Concerns;

use App\Enums\BusinessPermission;
use App\Enums\BusinessRole;
use App\Models\Company;

trait HasBusinessRole
{
    /**
     * Get the user's business (operational) role on the given company.
     */
    public function businessRole(Company $company): ?BusinessRole
    {
        return $this->companyMemberships()
            ->where('company_id', $company->id)
            ->first()
            ?->business_role;
    }

    /**
     * Determine if the user has the given business permission on the company.
     */
    public function hasBusinessPermission(Company $company, BusinessPermission $permission): bool
    {
        return $this->businessRole($company)?->hasPermission($permission) ?? false;
    }
}
