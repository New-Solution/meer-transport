<?php

namespace App\Policies;

use App\Enums\CompanyPermission;
use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Company $company): bool
    {
        return $user->belongsToCompany($company);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Company $company): bool
    {
        return $user->hasCompanyPermission($company, CompanyPermission::UpdateCompany);
    }

    /**
     * Determine whether the user can leave the company.
     */
    public function leave(User $user, Company $company): bool
    {
        return ! $company->is_personal
            && $user->belongsToCompany($company)
            && ! $user->ownsCompany($company);
    }

    /**
     * Determine whether the user can add a member to the company.
     */
    public function addMember(User $user, Company $company): bool
    {
        return $user->hasCompanyPermission($company, CompanyPermission::AddMember);
    }

    /**
     * Determine whether the user can update a member's role in the company.
     */
    public function updateMember(User $user, Company $company): bool
    {
        return $user->hasCompanyPermission($company, CompanyPermission::UpdateMember);
    }

    /**
     * Determine whether the user can remove a member from the company.
     */
    public function removeMember(User $user, Company $company): bool
    {
        return $user->hasCompanyPermission($company, CompanyPermission::RemoveMember);
    }

    /**
     * Determine whether the user can invite members to the company.
     */
    public function inviteMember(User $user, Company $company): bool
    {
        return $user->hasCompanyPermission($company, CompanyPermission::CreateInvitation);
    }

    /**
     * Determine whether the user can cancel invitations.
     */
    public function cancelInvitation(User $user, Company $company): bool
    {
        return $user->hasCompanyPermission($company, CompanyPermission::CancelInvitation);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Company $company): bool
    {
        return ! $company->is_personal && $user->hasCompanyPermission($company, CompanyPermission::DeleteCompany);
    }
}
