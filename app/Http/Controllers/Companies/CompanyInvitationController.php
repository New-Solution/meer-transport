<?php

namespace App\Http\Controllers\Companies;

use App\Enums\CompanyRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\CreateCompanyInvitationRequest;
use App\Http\Requests\Companies\RespondToCompanyInvitationRequest;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Notifications\Companies\CompanyInvitation as CompanyInvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class CompanyInvitationController extends Controller
{
    /**
     * Store a newly created invitation.
     */
    public function store(CreateCompanyInvitationRequest $request, Company $company): RedirectResponse
    {
        Gate::authorize('inviteMember', $company);

        $invitation = $company->invitations()->create([
            'email' => $request->validated('email'),
            'role' => CompanyRole::from($request->validated('role')),
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(3),
        ]);

        Notification::route('mail', $invitation->email)
            ->notify(new CompanyInvitationNotification($invitation));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation sent.')]);

        return to_route('companies.edit', ['company' => $company->slug]);
    }

    /**
     * Cancel the specified invitation.
     */
    public function destroy(Company $company, CompanyInvitation $invitation): RedirectResponse
    {
        abort_unless($invitation->company_id === $company->id, 404);

        Gate::authorize('cancelInvitation', $company);

        $invitation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation cancelled.')]);

        return to_route('companies.edit', ['company' => $company->slug]);
    }

    /**
     * Accept the invitation.
     */
    public function accept(RespondToCompanyInvitationRequest $request, CompanyInvitation $invitation): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $invitation) {
            $company = $invitation->company;

            $company->memberships()->firstOrCreate(
                ['user_id' => $user->id],
                ['role' => $invitation->role],
            );

            $invitation->update(['accepted_at' => now()]);

            $user->switchCompany($company);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation accepted.')]);

        return to_route('dashboard');
    }

    /**
     * Decline the invitation.
     */
    public function decline(RespondToCompanyInvitationRequest $request, CompanyInvitation $invitation): RedirectResponse
    {
        $invitation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation declined.')]);

        return to_route('dashboard');
    }
}
