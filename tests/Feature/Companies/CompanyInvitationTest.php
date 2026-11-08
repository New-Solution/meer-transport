<?php

namespace Tests\Feature\Companies;

use App\Enums\CompanyRole;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\User;
use App\Notifications\Companies\CompanyInvitation as CompanyInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CompanyInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_invitations_can_be_created()
    {
        Notification::fake();

        $owner = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $response = $this
            ->actingAs($owner)
            ->post(route('companies.invitations.store', $company), [
                'email' => 'invited@example.com',
                'role' => CompanyRole::Member->value,
            ]);

        $response->assertRedirect(route('companies.edit', $company));

        $this->assertDatabaseHas('company_invitations', [
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'role' => CompanyRole::Member->value,
        ]);
    }

    public function test_invitation_email_for_existing_users_uses_login_route()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => $invitedUser->email,
            'invited_by' => $owner->id,
        ]);

        $mail = (new CompanyInvitationNotification($invitation))->toMail($invitedUser);

        $this->assertSame(route('login', ['invitation' => $invitation->code]), $mail->actionUrl);
        $this->assertStringContainsString('dashboard', implode(' ', $mail->introLines));
    }

    public function test_invitation_email_for_unknown_users_uses_login_route()
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => 'unknown@example.com',
            'invited_by' => $owner->id,
        ]);

        $mail = (new CompanyInvitationNotification($invitation))->toMail((object) []);

        $this->assertSame(route('login', ['invitation' => $invitation->code]), $mail->actionUrl);
        $this->assertStringContainsString('log in', strtolower(implode(' ', $mail->introLines)));
    }

    public function test_company_invitations_can_be_created_by_admins()
    {
        Notification::fake();

        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($admin, ['role' => CompanyRole::Admin->value]);

        $response = $this
            ->actingAs($admin)
            ->post(route('companies.invitations.store', $company), [
                'email' => 'invited@example.com',
                'role' => CompanyRole::Member->value,
            ]);

        $response->assertRedirect(route('companies.edit', $company));
    }

    public function test_existing_company_members_cannot_be_invited()
    {
        Notification::fake();

        $owner = User::factory()->create();
        $member = User::factory()->create(['email' => 'member@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($owner)
            ->post(route('companies.invitations.store', $company), [
                'email' => 'member@example.com',
                'role' => CompanyRole::Member->value,
            ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_duplicate_invitations_cannot_be_created()
    {
        Notification::fake();

        $owner = User::factory()->create();
        $company = Company::factory()->create();
        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($owner)
            ->post(route('companies.invitations.store', $company), [
                'email' => 'invited@example.com',
                'role' => CompanyRole::Member->value,
            ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_company_invitations_cannot_be_created_by_members()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($member)
            ->post(route('companies.invitations.store', $company), [
                'email' => 'invited@example.com',
                'role' => CompanyRole::Member->value,
            ]);

        $response->assertForbidden();
    }

    public function test_company_invitations_can_be_cancelled_by_owners()
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($owner)
            ->delete(route('companies.invitations.destroy', [$company, $invitation]));

        $response->assertRedirect(route('companies.edit', $company));

        $this->assertDatabaseMissing('company_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_company_invitations_can_be_accepted()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'role' => CompanyRole::Member,
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->post(route('invitations.accept', $invitation));

        $response->assertRedirect(route('dashboard'));
        $response->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Invitation accepted.']);

        $this->assertTrue($invitedUser->fresh()->belongsToCompany($company));
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_company_invitations_can_be_declined_by_the_invited_user()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->delete(route('invitations.decline', $invitation));

        $response->assertRedirect(route('dashboard'));

        $this->assertDatabaseMissing('company_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_company_invitations_cannot_be_declined_by_uninvited_user()
    {
        $owner = User::factory()->create();
        $uninvitedUser = User::factory()->create(['email' => 'uninvited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($uninvitedUser)
            ->delete(route('invitations.decline', $invitation));

        $response->assertSessionHasErrors('invitation');

        $this->assertDatabaseHas('company_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_accepted_company_invitations_cannot_be_declined()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->accepted()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->delete(route('invitations.decline', $invitation));

        $response->assertSessionHasErrors('invitation');

        $this->assertDatabaseHas('company_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_company_invitations_cannot_be_accepted_by_uninvited_user()
    {
        $owner = User::factory()->create();
        $uninvitedUser = User::factory()->create(['email' => 'uninvited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($uninvitedUser)
            ->post(route('invitations.accept', $invitation));

        $response->assertSessionHasErrors('invitation');

        $this->assertFalse($uninvitedUser->fresh()->belongsToCompany($company));
    }

    public function test_expired_invitations_cannot_be_accepted()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->expired()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->post(route('invitations.accept', $invitation));

        $response->assertSessionHasErrors('invitation');

        $this->assertFalse($invitedUser->fresh()->belongsToCompany($company));
    }
}
