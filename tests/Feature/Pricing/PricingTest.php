<?php

namespace Tests\Feature\Pricing;

use App\Enums\BusinessRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingTest extends TestCase
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

        $response = $this->get(route('pricing.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_view_the_pricing_page()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('pricing.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('pricing/index'));
    }

    public function test_operations_manager_can_view_the_pricing_page()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::OperationsManager);

        $response = $this
            ->actingAs($user)
            ->get(route('pricing.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
    }

    public function test_dispatcher_cannot_view_the_pricing_page()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);

        $response = $this
            ->actingAs($user)
            ->get(route('pricing.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertForbidden();
    }

    public function test_viewer_cannot_view_the_pricing_page()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        $response = $this
            ->actingAs($user)
            ->get(route('pricing.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertForbidden();
    }
}
