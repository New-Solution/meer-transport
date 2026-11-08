<?php

namespace Tests\Feature\Contracts;

use App\Enums\BusinessRole;
use App\Enums\ContractStatus;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use App\Models\Destination;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractTest extends TestCase
{
    use RefreshDatabase;

    private function setBusinessRole(User $user, BusinessRole $role): void
    {
        $user->companyMemberships()
            ->where('company_id', $user->current_company_id)
            ->update(['business_role' => $role->value]);
    }

    private function route(array $overrides = []): array
    {
        return array_merge([
            'from_city' => 'Riyadh',
            'to_city' => 'Jeddah',
            'destination_id' => null,
            'vehicle_type' => 'Truck',
            'price' => '3500.00',
            'return_price' => '0',
            'stay_price' => '0',
            'stop_price' => '0',
            'additional_price' => '0',
        ], $overrides);
    }

    private function validPayload(User $user, array $overrides = []): array
    {
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);

        return array_merge([
            'contract_number' => 'TC-2026-0001',
            'customer_id' => $customer->id,
            'contract_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'status' => 'ACTIVE',
            'routes' => [$this->route()],
        ], $overrides);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();

        $response = $this->get(route('contracts.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_create_a_contract_with_customer_snapshot()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('contracts', [
            'company_id' => $user->current_company_id,
            'contract_number' => 'TC-2026-0001',
            'customer_id' => $payload['customer_id'],
            'status' => 'ACTIVE',
        ]);

        $contract = Contract::where('contract_number', 'TC-2026-0001')->firstOrFail();
        $customer = Customer::find($payload['customer_id']);
        $this->assertSame($customer->name, $contract->customer_snapshot['name']);
        $this->assertSame($customer->vat_number, $contract->customer_snapshot['vat_number']);

        $this->assertDatabaseHas('contract_routes', [
            'contract_id' => $contract->id,
            'from_city' => 'Riyadh',
            'to_city' => 'Jeddah',
            'price_halalas' => 350000,
        ]);
    }

    public function test_contract_number_is_uppercased_and_trimmed()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, ['contract_number' => '  tc-lower-case  ']);

        $this->actingAs($user)->post(
            route('contracts.store', ['current_company' => $user->currentCompany->slug]),
            $payload
        );

        $this->assertDatabaseHas('contracts', ['contract_number' => 'TC-LOWER-CASE']);
    }

    public function test_viewer_cannot_create_a_contract()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);
        $payload = $this->validPayload($user);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertForbidden();
    }

    public function test_dispatcher_can_view_but_not_create_a_contract()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);

        $this->actingAs($user)
            ->get(route('contracts.index', ['current_company' => $user->currentCompany->slug]))
            ->assertOk();

        $payload = $this->validPayload($user);
        $this->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload)
            ->assertForbidden();
    }

    public function test_duplicate_contract_number_is_rejected()
    {
        $user = User::factory()->create();
        Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_number' => 'TC-DUP-0001',
        ]);

        $payload = $this->validPayload($user, ['contract_number' => 'tc-dup-0001']);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('contract_number');
    }

    public function test_duplicate_contract_number_is_allowed_across_different_companies()
    {
        $userA = User::factory()->create();
        Contract::factory()->create([
            'company_id' => $userA->current_company_id,
            'contract_number' => 'SHARED-0001',
        ]);

        $userB = User::factory()->create();
        $payload = $this->validPayload($userB, ['contract_number' => 'SHARED-0001']);

        $response = $this
            ->actingAs($userB)
            ->post(route('contracts.store', ['current_company' => $userB->currentCompany->slug]), $payload);

        $response->assertRedirect();
    }

    public function test_expiry_date_cannot_be_before_contract_date()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, [
            'contract_date' => '2026-06-01',
            'expiry_date' => '2026-01-01',
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('expiry_date');
    }

    public function test_cannot_bind_contract_to_an_archived_customer()
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->archived()->create(['company_id' => $user->current_company_id]);

        $payload = $this->validPayload($user, ['customer_id' => $customer->id]);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('customer_id');
    }

    public function test_at_least_one_route_is_required()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, ['routes' => []]);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('routes');
    }

    public function test_route_with_identical_from_and_to_city_is_rejected()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, [
            'routes' => [$this->route(['from_city' => 'Riyadh', 'to_city' => 'riyadh'])],
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('routes.0.to_city');
    }

    public function test_route_price_must_be_greater_than_zero()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, [
            'routes' => [$this->route(['price' => '0'])],
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('routes.0.price');
    }

    public function test_duplicate_routes_in_the_same_submission_are_rejected()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, [
            'routes' => [
                $this->route(['from_city' => 'Riyadh', 'to_city' => 'Jeddah']),
                $this->route(['from_city' => 'Riyadh', 'to_city' => 'Jeddah']),
            ],
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('routes.1.from_city');
    }

    public function test_route_destination_must_belong_to_the_same_company()
    {
        $user = User::factory()->create();
        $otherDestination = Destination::factory()->create();

        $payload = $this->validPayload($user, [
            'routes' => [$this->route(['destination_id' => $otherDestination->id])],
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('contracts.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('routes.0.destination_id');
    }

    public function test_tariff_prices_are_stored_as_halalas()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, [
            'routes' => [$this->route([
                'price' => '3500.50',
                'return_price' => '100.25',
                'stay_price' => '50',
                'stop_price' => '25.75',
                'additional_price' => '10',
            ])],
        ]);

        $this->actingAs($user)->post(
            route('contracts.store', ['current_company' => $user->currentCompany->slug]),
            $payload
        );

        $this->assertDatabaseHas('contract_routes', [
            'price_halalas' => 350050,
            'return_price_halalas' => 10025,
            'stay_price_halalas' => 5000,
            'stop_price_halalas' => 2575,
            'additional_price_halalas' => 1000,
        ]);
    }

    public function test_a_contract_past_its_expiry_date_resolves_as_expired()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->expired()->create([
            'company_id' => $user->current_company_id,
            'status' => ContractStatus::Active,
        ]);

        $this->assertSame(ContractStatus::Expired, $contract->resolvedStatus());

        $response = $this
            ->actingAs($user)
            ->get(route('contracts.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertInertia(fn ($page) => $page
            ->component('contracts/index')
            ->where('contracts.0.status', 'EXPIRED')
        );
    }

    public function test_draft_contract_never_auto_resolves_to_expired()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->draft()->expired()->create([
            'company_id' => $user->current_company_id,
        ]);

        $this->assertSame(ContractStatus::Draft, $contract->resolvedStatus());
    }

    public function test_admin_can_update_a_contract_and_replace_routes()
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
        ]);

        $response = $this
            ->actingAs($user)
            ->put(route('contracts.update', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $contract,
            ]), [
                'contract_number' => $contract->contract_number,
                'customer_id' => $customer->id,
                'contract_date' => $contract->contract_date->format('Y-m-d'),
                'expiry_date' => $contract->expiry_date->format('Y-m-d'),
                'routes' => [$this->route(['from_city' => 'Dammam', 'to_city' => 'Riyadh'])],
            ]);

        $response->assertRedirect();
        $this->assertSame(1, $contract->routes()->count());
        $this->assertDatabaseHas('contract_routes', [
            'contract_id' => $contract->id,
            'from_city' => 'Dammam',
            'to_city' => 'Riyadh',
        ]);
    }

    public function test_updating_the_customer_recreates_the_snapshot()
    {
        $user = User::factory()->create();
        $oldCustomer = Customer::factory()->create(['company_id' => $user->current_company_id, 'name' => 'Old Co']);
        $newCustomer = Customer::factory()->create(['company_id' => $user->current_company_id, 'name' => 'New Co']);
        $contract = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'customer_id' => $oldCustomer->id,
        ]);

        $this->actingAs($user)->put(route('contracts.update', [
            'current_company' => $user->currentCompany->slug,
            'contract' => $contract,
        ]), [
            'contract_number' => $contract->contract_number,
            'customer_id' => $newCustomer->id,
            'contract_date' => $contract->contract_date->format('Y-m-d'),
            'expiry_date' => $contract->expiry_date->format('Y-m-d'),
            'routes' => [$this->route()],
        ]);

        $contract->refresh();
        $this->assertSame($newCustomer->id, $contract->customer_id);
        $this->assertSame('New Co', $contract->customer_snapshot['name']);
    }

    public function test_user_cannot_access_a_contract_belonging_to_another_company()
    {
        $user = User::factory()->create();
        $otherContract = Contract::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('contracts.show', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $otherContract,
            ]));

        $response->assertNotFound();
    }

    public function test_draft_contract_can_be_activated_before_expiry()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->draft()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(route('contracts.activate', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $contract,
            ]));

        $response->assertRedirect();
        $this->assertSame(ContractStatus::Active, $contract->fresh()->status);
    }

    public function test_draft_contract_cannot_be_activated_after_expiry()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->draft()->expired()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(route('contracts.activate', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $contract,
            ]));

        $response->assertRedirect();
        $this->assertSame(ContractStatus::Draft, $contract->fresh()->status);
    }

    public function test_only_draft_contracts_can_be_activated()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'status' => ContractStatus::Active,
        ]);

        $this->actingAs($user)->patch(route('contracts.activate', [
            'current_company' => $user->currentCompany->slug,
            'contract' => $contract,
        ]));

        $this->assertSame(ContractStatus::Active, $contract->fresh()->status);
    }

    public function test_active_contract_can_be_cancelled_with_reason()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(route('contracts.cancel', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $contract,
            ]), ['reason' => 'Customer requested termination']);

        $response->assertRedirect();
        $contract->refresh();
        $this->assertSame(ContractStatus::Cancelled, $contract->status);
        $this->assertSame('Customer requested termination', $contract->cancellation_reason);
        $this->assertSame($user->name, $contract->cancelled_by);
    }

    public function test_cancelling_preserves_routes()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->create(['company_id' => $user->current_company_id]);
        ContractRoute::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_id' => $contract->id,
        ]);

        $this->actingAs($user)->patch(route('contracts.cancel', [
            'current_company' => $user->currentCompany->slug,
            'contract' => $contract,
        ]));

        $this->assertSame(1, $contract->routes()->count());
    }

    public function test_already_cancelled_contract_cannot_be_cancelled_again()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->cancelled()->create(['company_id' => $user->current_company_id]);
        $originalCancelledAt = $contract->cancelled_at;

        $this->actingAs($user)->patch(route('contracts.cancel', [
            'current_company' => $user->currentCompany->slug,
            'contract' => $contract,
        ]));

        $this->assertTrue($originalCancelledAt->equalTo($contract->fresh()->cancelled_at));
    }

    public function test_admin_can_archive_a_contract()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(route('contracts.archive', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $contract,
            ]));

        $response->assertRedirect();
        $this->assertNotNull($contract->fresh()->archived_at);
    }

    public function test_draft_contract_can_be_permanently_deleted()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->draft()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('contracts.destroy', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $contract,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('contracts', ['id' => $contract->id]);
    }

    public function test_active_contract_cannot_be_permanently_deleted()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'status' => ContractStatus::Active,
        ]);

        $response = $this
            ->actingAs($user)
            ->delete(route('contracts.destroy', [
                'current_company' => $user->currentCompany->slug,
                'contract' => $contract,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseHas('contracts', ['id' => $contract->id]);
    }

    public function test_cancelled_contract_cannot_be_permanently_deleted()
    {
        $user = User::factory()->create();
        $contract = Contract::factory()->cancelled()->create(['company_id' => $user->current_company_id]);

        $this->actingAs($user)->delete(route('contracts.destroy', [
            'current_company' => $user->currentCompany->slug,
            'contract' => $contract,
        ]));

        $this->assertDatabaseHas('contracts', ['id' => $contract->id]);
    }

    public function test_eligible_for_orders_scope_excludes_future_dated_contracts()
    {
        $user = User::factory()->create();
        Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'status' => ContractStatus::Active,
            'contract_date' => now()->addMonth()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
        ]);
        $eligible = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'status' => ContractStatus::Active,
            'contract_date' => now()->subMonth()->format('Y-m-d'),
            'expiry_date' => now()->addMonth()->format('Y-m-d'),
        ]);

        $this->actingAs($user);

        $results = Contract::eligibleForOrders()->get();

        $this->assertCount(1, $results);
        $this->assertSame($eligible->id, $results->first()->id);
    }

    public function test_eligible_for_orders_scope_excludes_draft_and_cancelled()
    {
        $user = User::factory()->create();
        Contract::factory()->draft()->create(['company_id' => $user->current_company_id]);
        Contract::factory()->cancelled()->create(['company_id' => $user->current_company_id]);

        $this->actingAs($user);

        $this->assertCount(0, Contract::eligibleForOrders()->get());
    }

    public function test_customer_with_contracts_cannot_be_deleted()
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);
        Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'customer_id' => $customer->id,
        ]);

        $this->actingAs($user)->delete(route('customers.destroy', [
            'current_company' => $user->currentCompany->slug,
            'customer' => $customer,
        ]));

        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }

    public function test_destination_referenced_by_a_contract_route_cannot_be_deleted()
    {
        $user = User::factory()->create();
        $destination = Destination::factory()->create(['company_id' => $user->current_company_id]);
        $contract = Contract::factory()->create(['company_id' => $user->current_company_id]);
        ContractRoute::factory()->create([
            'company_id' => $user->current_company_id,
            'contract_id' => $contract->id,
            'destination_id' => $destination->id,
        ]);

        $this->actingAs($user)->delete(route('destinations.destroy', [
            'current_company' => $user->currentCompany->slug,
            'destination' => $destination,
        ]));

        $this->assertDatabaseHas('destinations', ['id' => $destination->id]);
    }
}
