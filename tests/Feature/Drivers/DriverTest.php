<?php

namespace Tests\Feature\Drivers;

use App\Enums\BusinessRole;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverTest extends TestCase
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
            'first_name' => 'Ahmed',
            'last_name' => 'Al-Saud',
            'nationality' => 'Saudi Arabia',
            'license_no' => 'LIC-12345',
            'license_expiry' => '2027-01-01',
            'saudi_id_iqama_no' => '1234567890',
            'id_iqama_expiry' => '2027-01-01',
            'mobile_phone_1' => '0501234567',
            'mobile_phone_2' => null,
            'home_city' => 'Riyadh',
        ], $overrides);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();

        $response = $this->get(route('drivers.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_view_the_drivers_index_page()
    {
        $user = User::factory()->create();
        Driver::factory()->count(2)->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->get(route('drivers.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('drivers/index')
            ->has('drivers', 2)
        );
    }

    public function test_admin_can_create_a_driver_with_minimal_fields()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(
                route('drivers.store', ['current_company' => $user->currentCompany->slug]),
                ['first_name' => 'Ahmed', 'last_name' => 'Al-Saud']
            );

        $response->assertRedirect();
        $this->assertDatabaseHas('drivers', [
            'company_id' => $user->current_company_id,
            'first_name' => 'Ahmed',
            'last_name' => 'Al-Saud',
        ]);
    }

    public function test_viewer_cannot_create_a_driver()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        $response = $this
            ->actingAs($user)
            ->post(
                route('drivers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload()
            );

        $response->assertForbidden();
    }

    public function test_dispatcher_can_create_but_not_delete_a_driver()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);
        $driver = Driver::factory()->create(['company_id' => $user->current_company_id]);

        $createResponse = $this
            ->actingAs($user)
            ->post(
                route('drivers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['saudi_id_iqama_no' => '9999999999'])
            );
        $createResponse->assertRedirect();

        $deleteResponse = $this
            ->actingAs($user)
            ->delete(route('drivers.destroy', [
                'current_company' => $user->currentCompany->slug,
                'driver' => $driver,
            ]));
        $deleteResponse->assertForbidden();
    }

    public function test_invalid_mobile_phone_is_rejected()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(
                route('drivers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['mobile_phone_1' => 'not-a-phone-at-all!!'])
            );

        $response->assertSessionHasErrors('mobile_phone_1');
    }

    public function test_saudi_id_normalization_prevents_duplicate_with_arabic_digits()
    {
        $user = User::factory()->create();
        Driver::factory()->create([
            'company_id' => $user->current_company_id,
            'saudi_id_iqama_no' => '1234567890',
        ]);

        $response = $this
            ->actingAs($user)
            ->post(
                route('drivers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['saudi_id_iqama_no' => '١٢٣٤٥٦٧٨٩٠'])
            );

        $response->assertSessionHasErrors('saudi_id_iqama_no');
    }

    public function test_multiple_drivers_can_have_no_saudi_id()
    {
        $user = User::factory()->create();
        Driver::factory()->create(['company_id' => $user->current_company_id, 'saudi_id_iqama_no' => null]);

        $response = $this
            ->actingAs($user)
            ->post(
                route('drivers.store', ['current_company' => $user->currentCompany->slug]),
                $this->validPayload(['saudi_id_iqama_no' => null])
            );

        $response->assertRedirect();
        $response->assertSessionDoesntHaveErrors();
    }

    public function test_search_filters_by_name()
    {
        $user = User::factory()->create();
        Driver::factory()->create(['company_id' => $user->current_company_id, 'first_name' => 'Findable']);
        Driver::factory()->create(['company_id' => $user->current_company_id, 'first_name' => 'Other']);

        $response = $this
            ->actingAs($user)
            ->get(route('drivers.index', [
                'current_company' => $user->currentCompany->slug,
                'search' => 'Findable',
            ]));

        $response->assertInertia(fn ($page) => $page
            ->component('drivers/index')
            ->has('drivers', 1)
        );
    }

    public function test_license_status_filter_finds_expired_drivers()
    {
        $user = User::factory()->create();
        Driver::factory()->create([
            'company_id' => $user->current_company_id,
            'license_expiry' => now()->subDay()->format('Y-m-d'),
        ]);
        Driver::factory()->create([
            'company_id' => $user->current_company_id,
            'license_expiry' => now()->addYear()->format('Y-m-d'),
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('drivers.index', [
                'current_company' => $user->currentCompany->slug,
                'license_status' => 'EXPIRED',
            ]));

        $response->assertInertia(fn ($page) => $page
            ->component('drivers/index')
            ->has('drivers', 1)
        );
    }

    public function test_admin_can_update_a_driver()
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(
                route('drivers.update', [
                    'current_company' => $user->currentCompany->slug,
                    'driver' => $driver,
                ]),
                $this->validPayload(['first_name' => 'Renamed', 'saudi_id_iqama_no' => $driver->saudi_id_iqama_no])
            );

        $response->assertRedirect();
        $this->assertDatabaseHas('drivers', ['id' => $driver->id, 'first_name' => 'Renamed']);
    }

    public function test_user_cannot_update_a_driver_belonging_to_another_company()
    {
        $user = User::factory()->create();
        $otherDriver = Driver::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(
                route('drivers.update', [
                    'current_company' => $user->currentCompany->slug,
                    'driver' => $otherDriver,
                ]),
                $this->validPayload(['saudi_id_iqama_no' => null])
            );

        $response->assertNotFound();
    }

    public function test_admin_can_delete_a_driver()
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('drivers.destroy', [
                'current_company' => $user->currentCompany->slug,
                'driver' => $driver,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('drivers', ['id' => $driver->id]);
    }
}
