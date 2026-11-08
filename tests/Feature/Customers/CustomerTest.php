<?php

namespace Tests\Feature\Customers;

use App\Enums\BusinessRole;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    private function setBusinessRole(User $user, BusinessRole $role): void
    {
        $user->companyMemberships()
            ->where('company_id', $user->current_company_id)
            ->update(['business_role' => $role->value]);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Al Nahda Trading Co.',
            'cr_number' => '4030123456',
            'unified_number' => '7001234567',
            'vat_number' => '310123456700003',
            'address' => 'Industrial Area, Riyadh 14332, Saudi Arabia',
        ], $overrides);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();

        $response = $this->get(route('customers.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_view_the_customers_index_page()
    {
        $user = User::factory()->create();
        Customer::factory()->count(2)->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->get(route('customers.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('customers/index')
            ->has('customers', 2)
        );
    }

    public function test_archived_customers_are_hidden_by_default()
    {
        $user = User::factory()->create();
        Customer::factory()->create(['company_id' => $user->current_company_id, 'name' => 'Active One']);
        Customer::factory()->archived()->create(['company_id' => $user->current_company_id, 'name' => 'Archived One']);

        $response = $this
            ->actingAs($user)
            ->get(route('customers.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertInertia(fn ($page) => $page
            ->component('customers/index')
            ->has('customers', 1)
            ->where('customers.0.name', 'Active One')
        );
    }

    public function test_archived_customers_are_shown_when_requested()
    {
        $user = User::factory()->create();
        Customer::factory()->archived()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->get(route('customers.index', [
                'current_company' => $user->currentCompany->slug,
                'include_archived' => true,
            ]));

        $response->assertInertia(fn ($page) => $page
            ->component('customers/index')
            ->has('customers', 1)
        );
    }

    public function test_search_filters_by_name_and_numbers()
    {
        $user = User::factory()->create();
        Customer::factory()->create(['company_id' => $user->current_company_id, 'name' => 'Findable Corp']);
        Customer::factory()->create(['company_id' => $user->current_company_id, 'name' => 'Other Corp']);

        $response = $this
            ->actingAs($user)
            ->get(route('customers.index', [
                'current_company' => $user->currentCompany->slug,
                'search' => 'Findable',
            ]));

        $response->assertInertia(fn ($page) => $page
            ->component('customers/index')
            ->has('customers', 1)
            ->where('customers.0.name', 'Findable Corp')
        );
    }

    public function test_admin_can_create_a_customer()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(
                route('customers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload()
            );

        $response->assertRedirect();
        $this->assertDatabaseHas('customers', [
            'company_id' => $user->current_company_id,
            'name' => 'Al Nahda Trading Co.',
        ]);
    }

    public function test_viewer_cannot_create_a_customer()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        $response = $this
            ->actingAs($user)
            ->post(
                route('customers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload()
            );

        $response->assertForbidden();
    }

    public function test_vat_number_must_be_fifteen_digits()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(
                route('customers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['vat_number' => '123'])
            );

        $response->assertSessionHasErrors('vat_number');
    }

    public function test_admin_can_update_a_customer()
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(
                route('customers.update', [
                    'current_company' => $user->currentCompany->slug,
                    'customer' => $customer,
                ]),
                $this->validPayload(['name' => 'Renamed Co.'])
            );

        $response->assertRedirect();
        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'name' => 'Renamed Co.']);
    }

    public function test_user_cannot_update_a_customer_belonging_to_another_company()
    {
        $user = User::factory()->create();
        $otherCustomer = Customer::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(
                route('customers.update', [
                    'current_company' => $user->currentCompany->slug,
                    'customer' => $otherCustomer,
                ]),
                $this->validPayload()
            );

        $response->assertNotFound();
    }

    public function test_admin_can_archive_and_restore_a_customer()
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);

        $archiveResponse = $this
            ->actingAs($user)
            ->patch(route('customers.archive', [
                'current_company' => $user->currentCompany->slug,
                'customer' => $customer,
            ]));
        $archiveResponse->assertRedirect();
        $this->assertNotNull($customer->fresh()->archived_at);

        $restoreResponse = $this
            ->actingAs($user)
            ->patch(route('customers.restore', [
                'current_company' => $user->currentCompany->slug,
                'customer' => $customer,
            ]));
        $restoreResponse->assertRedirect();
        $this->assertNull($customer->fresh()->archived_at);
    }

    public function test_operations_manager_can_archive_but_not_delete_a_customer()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::OperationsManager);
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);

        $archiveResponse = $this
            ->actingAs($user)
            ->patch(route('customers.archive', [
                'current_company' => $user->currentCompany->slug,
                'customer' => $customer,
            ]));
        $archiveResponse->assertRedirect();

        $deleteResponse = $this
            ->actingAs($user)
            ->delete(route('customers.destroy', [
                'current_company' => $user->currentCompany->slug,
                'customer' => $customer,
            ]));
        $deleteResponse->assertForbidden();
    }

    public function test_admin_can_delete_a_customer()
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('customers.destroy', [
                'current_company' => $user->currentCompany->slug,
                'customer' => $customer,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }
}
