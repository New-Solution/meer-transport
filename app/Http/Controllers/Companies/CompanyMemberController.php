<?php

namespace App\Http\Controllers\Companies;

use App\Enums\BusinessRole;
use App\Enums\CompanyRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateCompanyMemberBusinessRoleRequest;
use App\Http\Requests\Companies\UpdateCompanyMemberRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CompanyMemberController extends Controller
{
    /**
     * Update the specified company member's role.
     */
    public function update(UpdateCompanyMemberRequest $request, Company $company, User $user): RedirectResponse
    {
        Gate::authorize('updateMember', $company);

        $newRole = CompanyRole::from($request->validated('role'));

        $company->memberships()
            ->where('user_id', $user->id)
            ->firstOrFail()
            ->update(['role' => $newRole]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member role updated.')]);

        return to_route('companies.edit', ['company' => $company->slug]);
    }

    /**
     * Update the specified company member's business (operational) role.
     */
    public function updateBusinessRole(UpdateCompanyMemberBusinessRoleRequest $request, Company $company, User $user): RedirectResponse
    {
        Gate::authorize('updateMember', $company);

        $newRole = BusinessRole::from($request->validated('business_role'));

        $company->memberships()
            ->where('user_id', $user->id)
            ->firstOrFail()
            ->update(['business_role' => $newRole]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member business role updated.')]);

        return to_route('companies.edit', ['company' => $company->slug]);
    }

    /**
     * Remove the specified company member.
     */
    public function destroy(Company $company, User $user): RedirectResponse
    {
        Gate::authorize('removeMember', $company);

        abort_if($company->owner()?->is($user), 403, __('The company owner cannot be removed.'));

        $company->memberships()
            ->where('user_id', $user->id)
            ->delete();

        if ($user->isCurrentCompany($company)) {
            $user->switchCompany($user->personalCompany());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member removed.')]);

        return to_route('companies.edit', ['company' => $company->slug]);
    }
}
