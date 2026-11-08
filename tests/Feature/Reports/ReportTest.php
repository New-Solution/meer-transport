<?php

namespace Tests\Feature\Reports;

use App\Enums\BusinessRole;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private function setBusinessRole(User $user, BusinessRole $role): void
    {
        $user->companyMemberships()
            ->where('company_id', $user->current_company_id)
            ->update(['business_role' => $role->value]);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();

        $response = $this->get(route('reports.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_viewer_can_view_the_reports_page()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        $response = $this
            ->actingAs($user)
            ->get(route('reports.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('reports/index')
            ->where('activeTab', 'customer-contracts')
        );
    }

    public function test_customer_contracts_tab_excludes_other_companies_and_archived_contracts()
    {
        $user = User::factory()->create();
        Contract::factory()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-MINE']);
        Contract::factory()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-ARCHIVED', 'archived_at' => now()]);
        Contract::factory()->create(['contract_number' => 'TC-OTHER']); // different company

        $response = $this
            ->actingAs($user)
            ->get(route('reports.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertInertia(fn ($page) => $page
            ->component('reports/index')
            ->has('rows', 1)
            ->where('rows.0.contract_number', 'TC-MINE')
        );
    }

    public function test_customer_contracts_tab_filters_by_status()
    {
        $user = User::factory()->create();
        Contract::factory()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-ACTIVE']);
        Contract::factory()->draft()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-DRAFT']);

        $response = $this
            ->actingAs($user)
            ->get(route('reports.index', [
                'current_company' => $user->currentCompany->slug,
                'tab' => 'customer-contracts',
                'status' => 'DRAFT',
            ]));

        $response->assertInertia(fn ($page) => $page
            ->has('rows', 1)
            ->where('rows.0.contract_number', 'TC-DRAFT')
        );
    }

    public function test_active_contracts_tab_only_shows_eligible_contracts()
    {
        $user = User::factory()->create();
        Contract::factory()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-ACTIVE']);
        Contract::factory()->expired()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-EXPIRED']);
        Contract::factory()->cancelled()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-CANCELLED']);

        $response = $this
            ->actingAs($user)
            ->get(route('reports.index', [
                'current_company' => $user->currentCompany->slug,
                'tab' => 'active-contracts',
            ]));

        $response->assertInertia(fn ($page) => $page
            ->has('rows', 1)
            ->where('rows.0.contract_number', 'TC-ACTIVE')
        );
    }

    public function test_expired_contracts_tab_excludes_cancelled_contracts()
    {
        $user = User::factory()->create();
        Contract::factory()->expired()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-EXPIRED']);
        Contract::factory()->cancelled()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-CANCELLED']);

        $response = $this
            ->actingAs($user)
            ->get(route('reports.index', [
                'current_company' => $user->currentCompany->slug,
                'tab' => 'expired-contracts',
            ]));

        $response->assertInertia(fn ($page) => $page
            ->has('rows', 1)
            ->where('rows.0.contract_number', 'TC-EXPIRED')
        );
    }

    public function test_contract_routes_tab_filters_by_from_city_and_customer()
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);
        $contract = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'customer_id' => $customer->id,
        ]);
        ContractRoute::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_id' => $contract->id,
            'from_city' => 'Riyadh',
            'to_city' => 'Jeddah',
        ]);
        ContractRoute::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_id' => $contract->id,
            'from_city' => 'Dammam',
            'to_city' => 'Jeddah',
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('reports.index', [
                'current_company' => $user->currentCompany->slug,
                'tab' => 'contract-routes',
                'from_city' => 'Riyadh',
            ]));

        $response->assertInertia(fn ($page) => $page
            ->has('rows', 1)
            ->where('rows.0.from_city', 'Riyadh')
        );
    }

    public function test_csv_download_returns_csv_content_for_the_active_tab()
    {
        $user = User::factory()->create();
        Contract::factory()->create(['company_id' => $user->current_company_id, 'contract_number' => 'TC-DOWNLOAD']);

        $response = $this
            ->actingAs($user)
            ->get(route('reports.download', [
                'current_company' => $user->currentCompany->slug,
                'tab' => 'customer-contracts',
            ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('TC-DOWNLOAD', $response->streamedContent());
    }

    public function test_dispatcher_can_view_reports()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);

        $response = $this
            ->actingAs($user)
            ->get(route('reports.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
    }
}
