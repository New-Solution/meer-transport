<?php

namespace Tests\Feature\Trucks;

use App\Enums\BusinessRole;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckTest extends TestCase
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
            'weight_type' => 'HEAVY',
            'vehicle_type' => 'TANKER',
            'license_plate' => '1234 ABC',
            'is_external' => true,
            'is_internal' => false,
        ], $overrides);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();

        $response = $this->get(route('trucks.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_view_the_trucks_index_page()
    {
        $user = User::factory()->create();
        Truck::factory()->count(2)->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->get(route('trucks.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('trucks/index')
            ->has('trucks', 2)
        );
    }

    public function test_admin_can_create_a_truck()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(
                route('trucks.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload()
            );

        $response->assertRedirect();
        $this->assertDatabaseHas('trucks', [
            'company_id' => $user->current_company_id,
            'license_plate' => '1234 ABC',
            'normalized_license_plate' => '1234 ABC',
        ]);
    }

    public function test_viewer_cannot_create_a_truck()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        $response = $this
            ->actingAs($user)
            ->post(
                route('trucks.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload()
            );

        $response->assertForbidden();
    }

    public function test_dispatcher_can_create_but_not_delete_a_truck()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);
        $truck = Truck::factory()->create(['company_id' => $user->current_company_id]);

        $createResponse = $this
            ->actingAs($user)
            ->post(
                route('trucks.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['license_plate' => '9999 XYZ'])
            );
        $createResponse->assertRedirect();

        $deleteResponse = $this
            ->actingAs($user)
            ->delete(route('trucks.destroy', [
                'current_company' => $user->currentCompany->slug,
                'truck' => $truck,
            ]));
        $deleteResponse->assertForbidden();
    }

    public function test_at_least_one_of_internal_or_external_is_required()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(
                route('trucks.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['is_external' => false, 'is_internal' => false])
            );

        $response->assertSessionHasErrors('is_external');
    }

    public function test_license_plate_normalization_prevents_duplicate_with_arabic_digits()
    {
        $user = User::factory()->create();
        Truck::factory()->create([
            'company_id' => $user->current_company_id,
            'license_plate' => '1234 ABC',
        ]);

        // Same plate, written with Arabic-Indic digits for 1234.
        $response = $this
            ->actingAs($user)
            ->post(
                route('trucks.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['license_plate' => '١٢٣٤ ABC'])
            );

        $response->assertSessionHasErrors('normalized_license_plate');
    }

    public function test_duplicate_plate_is_allowed_across_different_companies()
    {
        $userA = User::factory()->create();
        Truck::factory()->create(['company_id' => $userA->current_company_id, 'license_plate' => 'SHARED 1']);

        $userB = User::factory()->create();

        $response = $this
            ->actingAs($userB)
            ->post(
                route('trucks.store', ['current_company' => $userB->currentCompany->slug]),
                $this->validPayload(['license_plate' => 'SHARED 1'])
            );

        $response->assertRedirect();
        $this->assertDatabaseHas('trucks', [
            'company_id' => $userB->current_company_id,
            'license_plate' => 'SHARED 1',
        ]);
    }

    public function test_admin_can_update_a_truck()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(
                route('trucks.update', [
                    'current_company' => $user->currentCompany->slug,
                    'truck' => $truck,
                ]),
                $this->validPayload(['license_plate' => 'UPDATED 1'])
            );

        $response->assertRedirect();
        $this->assertDatabaseHas('trucks', ['id' => $truck->id, 'license_plate' => 'UPDATED 1']);
    }

    public function test_updating_a_truck_can_clear_the_internal_flag()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create([
            'company_id' => $user->current_company_id,
            'is_internal' => true,
            'is_external' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->patch(
                route('trucks.update', [
                    'current_company' => $user->currentCompany->slug,
                    'truck' => $truck,
                ]),
                $this->validPayload(['is_internal' => false, 'is_external' => true])
            );

        $response->assertRedirect();
        $truck->refresh();
        $this->assertFalse($truck->is_internal);
        $this->assertTrue($truck->is_external);
    }

    public function test_user_cannot_update_a_truck_belonging_to_another_company()
    {
        $user = User::factory()->create();
        $otherTruck = Truck::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(
                route('trucks.update', [
                    'current_company' => $user->currentCompany->slug,
                    'truck' => $otherTruck,
                ]),
                $this->validPayload()
            );

        $response->assertNotFound();
    }

    public function test_admin_can_delete_a_truck()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('trucks.destroy', [
                'current_company' => $user->currentCompany->slug,
                'truck' => $truck,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('trucks', ['id' => $truck->id]);
    }
}
