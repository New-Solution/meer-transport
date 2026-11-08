<?php

namespace Tests\Feature\TransportOrders;

use App\Enums\BusinessRole;
use App\Enums\ContractStatus;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\TransportOrder;
use App\Models\TransportTrip;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransportOrderTest extends TestCase
{
    use RefreshDatabase;

    private function setBusinessRole(User $user, BusinessRole $role): void
    {
        $user->companyMemberships()
            ->where('company_id', $user->current_company_id)
            ->update(['business_role' => $role->value]);
    }

    /**
     * @return array{customer: Customer, contract: Contract, route: ContractRoute}
     */
    private function setUpContract(User $user, array $routeOverrides = []): array
    {
        $customer = Customer::factory()->create(['company_id' => $user->current_company_id]);
        $contract = Contract::factory()->create([
            'company_id' => $user->current_company_id,
            'customer_id' => $customer->id,
            'status' => ContractStatus::Active,
            'contract_date' => now()->subMonth()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
        ]);
        $route = ContractRoute::factory()->create(array_merge([
            'company_id' => $user->current_company_id,
            'contract_id' => $contract->id,
            'price_halalas' => 350000,
        ], $routeOverrides));

        return ['customer' => $customer, 'contract' => $contract, 'route' => $route];
    }

    private function validPayload(User $user, array $overrides = []): array
    {
        $world = $this->setUpContract($user);

        return array_merge([
            'order_date' => now()->format('Y-m-d'),
            'required_delivery_date' => now()->addDays(3)->format('Y-m-d'),
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
            'trips' => [
                [
                    'planned_pickup_date' => now()->format('Y-m-d'),
                    'planned_delivery_date' => now()->addDay()->format('Y-m-d'),
                ],
            ],
        ], $overrides);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();

        $response = $this->get(route('transport-orders.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_create_an_order_with_auto_generated_number()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertRedirect();

        $order = TransportOrder::firstOrFail();
        $this->assertStringStartsWith('TO-'.now()->year.'-', $order->order_number);
        $this->assertSame(1, $order->trip_count);
        $this->assertSame(350000, $order->total_amount_halalas);
        $this->assertSame('DRAFT', $order->status->value);

        $this->assertDatabaseHas('transport_trips', [
            'order_id' => $order->id,
            'trip_number' => "{$order->order_number}-TRIP-001",
            'sequence_number' => 1,
        ]);
    }

    public function test_order_number_sequence_increments_per_year()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(
            route('transport-orders.store', ['current_company' => $user->currentCompany->slug]),
            $this->validPayload($user)
        );
        $this->actingAs($user)->post(
            route('transport-orders.store', ['current_company' => $user->currentCompany->slug]),
            $this->validPayload($user)
        );

        $numbers = TransportOrder::pluck('order_number')->sort()->values();
        $this->assertCount(2, $numbers);
        $this->assertNotSame($numbers[0], $numbers[1]);
    }

    public function test_viewer_cannot_create_an_order()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $this->validPayload($user));

        $response->assertForbidden();
    }

    public function test_dispatcher_can_create_an_order()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $this->validPayload($user));

        $response->assertRedirect();
    }

    public function test_order_cannot_be_created_against_an_archived_customer()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);
        $world['customer']->update(['archived_at' => now()]);

        $payload = $this->validPayload($user, [
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('customer_id');
    }

    public function test_order_cannot_be_created_against_a_cancelled_contract()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);
        $world['contract']->update(['status' => ContractStatus::Cancelled]);

        $payload = $this->validPayload($user, [
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('contract_id');
    }

    public function test_order_date_must_fall_within_contract_validity_window()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);

        // Before the contract's start date, but still within its expiry, so
        // the resolved status is ACTIVE and the explicit window check fires.
        $payload = $this->validPayload($user, [
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
            'order_date' => now()->subYear()->format('Y-m-d'),
            'required_delivery_date' => now()->subYear()->addDay()->format('Y-m-d'),
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('order_date');
    }

    public function test_route_must_belong_to_the_selected_contract()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);
        $otherWorld = $this->setUpContract($user);

        $payload = $this->validPayload($user, [
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $otherWorld['route']->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('contract_route_id');
    }

    public function test_trip_delivery_date_must_be_on_or_after_pickup_date()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, [
            'trips' => [[
                'planned_pickup_date' => now()->addDays(3)->format('Y-m-d'),
                'planned_delivery_date' => now()->format('Y-m-d'),
            ]],
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('trips.0.planned_delivery_date');
    }

    public function test_truck_from_another_company_cannot_be_assigned_to_a_trip()
    {
        $user = User::factory()->create();
        $otherTruck = Truck::factory()->create();

        $payload = $this->validPayload($user, [
            'trips' => [[
                'planned_pickup_date' => now()->format('Y-m-d'),
                'planned_delivery_date' => now()->addDay()->format('Y-m-d'),
                'truck_id' => $otherTruck->id,
            ]],
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('trips.0.truck_id');
    }

    public function test_dispatcher_cannot_override_price()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);

        $payload = $this->validPayload($user, ['applied_price' => '9999.00']);

        $response = $this
            ->actingAs($user)
            ->post(route('transport-orders.store', ['current_company' => $user->currentCompany->slug]), $payload);

        $response->assertSessionHasErrors('applied_price');
    }

    public function test_admin_can_override_price_with_audit_trail()
    {
        $user = User::factory()->create();
        $payload = $this->validPayload($user, [
            'applied_price' => '4000.00',
            'override_reason' => 'Fuel surcharge',
        ]);

        $this->actingAs($user)->post(
            route('transport-orders.store', ['current_company' => $user->currentCompany->slug]),
            $payload
        );

        $order = TransportOrder::firstOrFail();
        $this->assertTrue($order->price_overridden);
        $this->assertSame(400000, $order->applied_price_halalas);
        $this->assertSame('Fuel surcharge', $order->override_reason);
        $this->assertSame($user->name, $order->override_authorized_by);
        $this->assertNotNull($order->override_authorized_at);
    }

    public function test_total_amount_includes_enabled_additional_charges_and_truck_amount()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user, ['return_price_halalas' => 50000]);

        $payload = $this->validPayload($user, [
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
            'additional_charges' => [
                ['type' => 'return', 'enabled' => true],
            ],
            'trips' => [[
                'planned_pickup_date' => now()->format('Y-m-d'),
                'planned_delivery_date' => now()->addDay()->format('Y-m-d'),
                'truck_amount' => '100.00',
            ]],
        ]);

        $this->actingAs($user)->post(
            route('transport-orders.store', ['current_company' => $user->currentCompany->slug]),
            $payload
        );

        $order = TransportOrder::firstOrFail();
        // 3500 base + 500 return charge + 100 truck amount = 4100 SAR = 410000 halalas
        $this->assertSame(410000, $order->total_amount_halalas);
    }

    public function test_customer_and_contract_snapshots_are_captured()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);

        $payload = $this->validPayload($user, [
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
        ]);

        $this->actingAs($user)->post(
            route('transport-orders.store', ['current_company' => $user->currentCompany->slug]),
            $payload
        );

        $order = TransportOrder::firstOrFail();
        $this->assertSame($world['customer']->name, $order->customer_snapshot['name']);
        $this->assertSame($world['contract']->contract_number, $order->contract_snapshot['contract_number']);
        $this->assertSame('Riyadh', $order->route_snapshot['from_city']);
    }

    public function test_only_draft_orders_can_be_updated()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);
        $order = TransportOrder::factory()->confirmed()->create([
            'company_id' => $user->current_company_id,
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
        ]);

        $payload = $this->validPayload($user, [
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->put(route('transport-orders.update', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]), $payload);

        $response->assertRedirect();
        $this->assertSame('CONFIRMED', $order->fresh()->status->value);
    }

    public function test_draft_order_can_be_confirmed()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);
        $order = TransportOrder::factory()->create([
            'company_id' => $user->current_company_id,
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
            'applied_price_halalas' => $world['route']->price_halalas,
        ]);
        TransportTrip::factory()->create([
            'company_id' => $user->current_company_id,
            'order_id' => $order->id,
            'trip_number' => "{$order->order_number}-TRIP-001",
            'sequence_number' => 1,
            'status' => 'DRAFT',
            'applied_price_halalas' => $world['route']->price_halalas,
            'planned_pickup_date' => now()->format('Y-m-d'),
            'planned_delivery_date' => now()->addDay()->format('Y-m-d'),
        ]);

        $response = $this
            ->actingAs($user)
            ->patch(route('transport-orders.confirm', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]));

        $response->assertRedirect();
        $order->refresh();
        $this->assertSame('CONFIRMED', $order->status->value);
        $this->assertNotNull($order->confirmed_at);
        $this->assertSame($user->name, $order->confirmed_by);
        $this->assertSame('CONFIRMED', $order->trips->first()->status->value);
    }

    public function test_confirming_fails_if_contract_was_cancelled_after_order_creation()
    {
        $user = User::factory()->create();
        $world = $this->setUpContract($user);
        $order = TransportOrder::factory()->create([
            'company_id' => $user->current_company_id,
            'customer_id' => $world['customer']->id,
            'contract_id' => $world['contract']->id,
            'contract_route_id' => $world['route']->id,
            'applied_price_halalas' => $world['route']->price_halalas,
        ]);
        TransportTrip::factory()->create([
            'company_id' => $user->current_company_id,
            'order_id' => $order->id,
            'trip_number' => "{$order->order_number}-TRIP-001",
            'sequence_number' => 1,
            'status' => 'DRAFT',
            'applied_price_halalas' => $world['route']->price_halalas,
            'planned_pickup_date' => now()->format('Y-m-d'),
            'planned_delivery_date' => now()->addDay()->format('Y-m-d'),
        ]);
        $world['contract']->update(['status' => ContractStatus::Cancelled]);

        $response = $this
            ->actingAs($user)
            ->patch(route('transport-orders.confirm', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]));

        $response->assertRedirect();
        $this->assertSame('DRAFT', $order->fresh()->status->value);
    }

    public function test_already_confirmed_order_cannot_be_confirmed_again()
    {
        $user = User::factory()->create();
        $order = TransportOrder::factory()->confirmed()->create(['company_id' => $user->current_company_id]);
        $originalConfirmedAt = $order->confirmed_at;

        $this->actingAs($user)->patch(route('transport-orders.confirm', [
            'current_company' => $user->currentCompany->slug,
            'transport_order' => $order,
        ]));

        $this->assertTrue($originalConfirmedAt->equalTo($order->fresh()->confirmed_at));
    }

    public function test_cancel_requires_a_reason()
    {
        $user = User::factory()->create();
        $order = TransportOrder::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(route('transport-orders.cancel', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]), ['reason' => '']);

        $response->assertRedirect();
        $this->assertSame('DRAFT', $order->fresh()->status->value);
    }

    public function test_admin_can_cancel_a_confirmed_order_with_reason()
    {
        $user = User::factory()->create();
        $order = TransportOrder::factory()->confirmed()->create(['company_id' => $user->current_company_id]);
        $trip = TransportTrip::factory()->create([
            'company_id' => $user->current_company_id,
            'order_id' => $order->id,
            'status' => 'CONFIRMED',
        ]);

        $response = $this
            ->actingAs($user)
            ->patch(route('transport-orders.cancel', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]), ['reason' => 'Customer cancelled shipment']);

        $response->assertRedirect();
        $order->refresh();
        $this->assertSame('CANCELLED', $order->status->value);
        $this->assertSame('Customer cancelled shipment', $order->cancellation_reason);
        $this->assertSame('CANCELLED', $trip->fresh()->status->value);
    }

    public function test_dispatcher_cannot_cancel_an_order()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);
        $order = TransportOrder::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(route('transport-orders.cancel', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]), ['reason' => 'Test']);

        $response->assertForbidden();
    }

    public function test_draft_order_can_be_deleted()
    {
        $user = User::factory()->create();
        $order = TransportOrder::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('transport-orders.destroy', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('transport_orders', ['id' => $order->id]);
    }

    public function test_confirmed_order_cannot_be_deleted()
    {
        $user = User::factory()->create();
        $order = TransportOrder::factory()->confirmed()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('transport-orders.destroy', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $order,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseHas('transport_orders', ['id' => $order->id]);
    }

    public function test_user_cannot_access_an_order_from_another_company()
    {
        $user = User::factory()->create();
        $otherOrder = TransportOrder::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('transport-orders.show', [
                'current_company' => $user->currentCompany->slug,
                'transport_order' => $otherOrder,
            ]));

        $response->assertNotFound();
    }

    public function test_truck_referenced_by_a_trip_cannot_be_deleted()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create(['company_id' => $user->current_company_id]);
        $order = TransportOrder::factory()->create(['company_id' => $user->current_company_id]);
        TransportTrip::factory()->create([
            'company_id' => $user->current_company_id,
            'order_id' => $order->id,
            'truck_id' => $truck->id,
        ]);

        $this->actingAs($user)->delete(route('trucks.destroy', [
            'current_company' => $user->currentCompany->slug,
            'truck' => $truck,
        ]));

        $this->assertDatabaseHas('trucks', ['id' => $truck->id]);
    }

    public function test_driver_referenced_by_a_trip_cannot_be_deleted()
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create(['company_id' => $user->current_company_id]);
        $order = TransportOrder::factory()->create(['company_id' => $user->current_company_id]);
        TransportTrip::factory()->create([
            'company_id' => $user->current_company_id,
            'order_id' => $order->id,
            'driver_id' => $driver->id,
        ]);

        $this->actingAs($user)->delete(route('drivers.destroy', [
            'current_company' => $user->currentCompany->slug,
            'driver' => $driver,
        ]));

        $this->assertDatabaseHas('drivers', ['id' => $driver->id]);
    }
}
