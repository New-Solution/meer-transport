<?php

namespace Tests\Feature;

use App\Enums\CompanyRole;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();
        $company = $user->currentCompany;

        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $company = $user->currentCompany;

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard'));

        $response->assertOk();
    }

    public function test_dashboard_includes_pending_invitations_for_the_authenticated_user()
    {
        $owner = User::factory()->create(['name' => 'Taylor Otwell']);
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create(['name' => 'Laravel Company']);

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 1)
            ->where('pendingInvitations.0.code', $invitation->code)
            ->where('pendingInvitations.0.inviterName', 'Taylor Otwell')
            ->where('pendingInvitations.0.company.name', 'Laravel Company')
            ->where('pendingInvitations.0.company.slug', $company->slug)
            ->missing('pendingInvitations.0.companyName'),
        );
    }

    public function test_dashboard_does_not_include_accepted_invitations()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        CompanyInvitation::factory()->accepted()->create([
            'company_id' => $company->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 0),
        );
    }

    public function test_dashboard_excludes_expired_invitations_without_deleting_them()
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
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 0),
        );

        $this->assertDatabaseHas('company_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_dashboard_does_not_include_or_delete_other_users_invitations()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $invitation = CompanyInvitation::factory()->expired()->create([
            'company_id' => $company->id,
            'email' => 'someone@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 0),
        );

        $this->assertDatabaseHas('company_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_dashboard_metrics_count_contracts_by_resolved_status()
    {
        $user = User::factory()->create();
        Contract::factory()->create(['company_id' => $user->current_company_id]);
        Contract::factory()->draft()->create(['company_id' => $user->current_company_id]);
        Contract::factory()->expired()->create(['company_id' => $user->current_company_id]);
        Contract::factory()->cancelled()->create(['company_id' => $user->current_company_id]);
        Contract::factory()->create(); // different company, must be excluded

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('metrics.totalContracts', 4)
            ->where('metrics.activeContracts', 1)
            ->where('metrics.draftContracts', 1)
            ->where('metrics.expiredContracts', 1)
            ->where('metrics.cancelledContracts', 1),
        );
    }

    public function test_dashboard_upcoming_expirations_only_include_active_contracts_expiring_within_30_days()
    {
        $user = User::factory()->create();

        $soon = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_number' => 'TC-SOON',
            'contract_date' => now()->subMonth()->toDateString(),
            'expiry_date' => now()->addDays(5)->toDateString(),
        ]);
        Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_number' => 'TC-FAR',
            'contract_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(60)->toDateString(),
        ]);
        Contract::factory()->draft()->create([
            'company_id' => $user->current_company_id,
            'contract_number' => 'TC-DRAFT-SOON',
            'expiry_date' => now()->addDays(2)->toDateString(),
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('upcomingExpirations', 1)
            ->where('upcomingExpirations.0.contract_number', $soon->contract_number)
            ->where('upcomingExpirations.0.days_remaining', 5),
        );
    }

    public function test_dashboard_recent_contracts_are_sorted_by_contract_date_descending()
    {
        $user = User::factory()->create();

        Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_number' => 'TC-OLDEST',
            'contract_date' => now()->subDays(10)->toDateString(),
        ]);
        $newest = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_number' => 'TC-NEWEST',
            'contract_date' => now()->toDateString(),
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('recentContracts.0.contract_number', $newest->contract_number),
        );
    }

    public function test_dashboard_excludes_other_companies_customers_from_total_customer_count()
    {
        $user = User::factory()->create();
        Customer::factory()->create(['company_id' => $user->current_company_id]);
        Customer::factory()->create(); // different company

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('metrics.totalCustomers', 1),
        );
    }
}
