<?php

namespace Tests\Feature\Destinations;

use App\Enums\BusinessRole;
use App\Models\Destination;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DestinationTest extends TestCase
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

        $response = $this->get(route('destinations.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_view_the_destinations_index_page()
    {
        $user = User::factory()->create();
        Destination::factory()->count(2)->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->get(route('destinations.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('destinations/index')
            ->has('destinations', 2)
        );
    }

    public function test_viewer_can_view_but_not_see_other_companies_destinations()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        Destination::factory()->create(['company_id' => $user->current_company_id, 'name' => 'Mine']);
        Destination::factory()->create(['name' => 'Someone else\'s']); // different company

        $response = $this
            ->actingAs($user)
            ->get(route('destinations.index', ['current_company' => $user->currentCompany->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('destinations/index')
            ->has('destinations', 1)
            ->where('destinations.0.name', 'Mine')
        );
    }

    public function test_admin_can_create_a_destination()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('destinations.store', ['current_company' => $user->currentCompany->slug]), [
                'name' => 'Jeddah Islamic Port',
                'google_maps_url' => 'https://maps.google.com/?q=21.4858,39.1925',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('destinations', [
            'company_id' => $user->current_company_id,
            'name' => 'Jeddah Islamic Port',
        ]);
    }

    public function test_viewer_cannot_create_a_destination()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Viewer);

        $response = $this
            ->actingAs($user)
            ->post(route('destinations.store', ['current_company' => $user->currentCompany->slug]), [
                'name' => 'Jeddah Islamic Port',
                'google_maps_url' => 'https://maps.google.com/?q=21.4858,39.1925',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('destinations', ['name' => 'Jeddah Islamic Port']);
    }

    public function test_dispatcher_can_create_but_not_delete_a_destination()
    {
        $user = User::factory()->create();
        $this->setBusinessRole($user, BusinessRole::Dispatcher);
        $destination = Destination::factory()->create(['company_id' => $user->current_company_id]);

        $createResponse = $this
            ->actingAs($user)
            ->post(route('destinations.store', ['current_company' => $user->currentCompany->slug]), [
                'name' => 'New Spot',
                'google_maps_url' => 'https://maps.google.com/?q=1,1',
            ]);
        $createResponse->assertRedirect();

        $deleteResponse = $this
            ->actingAs($user)
            ->delete(route('destinations.destroy', [
                'current_company' => $user->currentCompany->slug,
                'destination' => $destination,
            ]));
        $deleteResponse->assertForbidden();
    }

    public function test_destination_name_must_be_unique_within_the_company()
    {
        $user = User::factory()->create();
        Destination::factory()->create(['company_id' => $user->current_company_id, 'name' => 'Riyadh Depot']);

        $response = $this
            ->actingAs($user)
            ->post(route('destinations.store', ['current_company' => $user->currentCompany->slug]), [
                'name' => 'Riyadh Depot',
                'google_maps_url' => 'https://maps.google.com/?q=1,1',
            ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_duplicate_name_is_allowed_across_different_companies()
    {
        $userA = User::factory()->create();
        Destination::factory()->create(['company_id' => $userA->current_company_id, 'name' => 'Shared Name']);

        $userB = User::factory()->create();

        $response = $this
            ->actingAs($userB)
            ->post(route('destinations.store', ['current_company' => $userB->currentCompany->slug]), [
                'name' => 'Shared Name',
                'google_maps_url' => 'https://maps.google.com/?q=1,1',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('destinations', [
            'company_id' => $userB->current_company_id,
            'name' => 'Shared Name',
        ]);
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function invalidUrlProvider(): array
    {
        return [
            'http (not https)' => ['http://maps.google.com/?q=1,1'],
            'javascript scheme' => ['javascript:alert(1)'],
            'unrelated domain' => ['https://example.com/maps'],
            'empty' => [''],
        ];
    }

    #[DataProvider('invalidUrlProvider')]
    public function test_invalid_google_maps_urls_are_rejected(string $url)
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('destinations.store', ['current_company' => $user->currentCompany->slug]), [
                'name' => 'Some Place',
                'google_maps_url' => $url,
            ]);

        $response->assertSessionHasErrors('google_maps_url');
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function validUrlProvider(): array
    {
        return [
            'maps.google.com' => ['https://maps.google.com/?q=21.4858,39.1925'],
            'google.com/maps' => ['https://www.google.com/maps/place/Jeddah'],
            'maps.app.goo.gl' => ['https://maps.app.goo.gl/AbCdEf123'],
            'goo.gl/maps' => ['https://goo.gl/maps/AbCdEf123'],
        ];
    }

    #[DataProvider('validUrlProvider')]
    public function test_valid_google_maps_url_variants_are_accepted(string $url)
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('destinations.store', ['current_company' => $user->currentCompany->slug]), [
                'name' => 'Some Place '.crc32($url),
                'google_maps_url' => $url,
            ]);

        $response->assertRedirect();
        $response->assertSessionDoesntHaveErrors('google_maps_url');
    }

    public function test_admin_can_update_a_destination()
    {
        $user = User::factory()->create();
        $destination = Destination::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->patch(route('destinations.update', [
                'current_company' => $user->currentCompany->slug,
                'destination' => $destination,
            ]), [
                'name' => 'Updated Name',
                'google_maps_url' => 'https://maps.google.com/?q=2,2',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('destinations', [
            'id' => $destination->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_user_cannot_update_a_destination_belonging_to_another_company()
    {
        $user = User::factory()->create();
        $otherCompanysDestination = Destination::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('destinations.update', [
                'current_company' => $user->currentCompany->slug,
                'destination' => $otherCompanysDestination,
            ]), [
                'name' => 'Hijacked',
                'google_maps_url' => 'https://maps.google.com/?q=2,2',
            ]);

        $response->assertNotFound();
    }

    public function test_admin_can_delete_a_destination()
    {
        $user = User::factory()->create();
        $destination = Destination::factory()->create(['company_id' => $user->current_company_id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('destinations.destroy', [
                'current_company' => $user->currentCompany->slug,
                'destination' => $destination,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('destinations', ['id' => $destination->id]);
    }
}
