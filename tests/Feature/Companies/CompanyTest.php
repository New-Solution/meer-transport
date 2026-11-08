<?php

namespace Tests\Feature\Companies;

use App\Enums\CompanyRole;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CompanyTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_companies_index_page_can_be_rendered()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('companies.index'));

        $response->assertOk();
    }

    public function test_companies_can_be_created()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('companies.store'), [
                'name' => 'Test Company',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('companies', [
            'name' => 'Test Company',
            'is_personal' => false,
        ]);
    }

    public function test_company_slug_uses_next_available_suffix()
    {
        $user = User::factory()->create();

        Company::factory()->create(['name' => 'Acme', 'slug' => 'acme']);
        Company::factory()->create(['name' => 'Acme One', 'slug' => 'acme-1']);
        Company::factory()->create(['name' => 'Acme Ten', 'slug' => 'acme-10']);

        $this
            ->actingAs($user)
            ->post(route('companies.store'), [
                'name' => 'Acme',
            ]);

        $this->assertDatabaseHas('companies', [
            'name' => 'Acme',
            'slug' => 'acme-11',
        ]);
    }

    public function test_the_company_edit_page_can_be_rendered()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $response = $this
            ->actingAs($user)
            ->get(route('companies.edit', $company));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('companies/edit')
                ->where('members.0.role', CompanyRole::Owner->value)
                ->where('members.0.role_label', CompanyRole::Owner->label()),
            );
    }

    public function test_companies_can_be_updated_by_owners()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create(['name' => 'Original Name']);

        $company->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $response = $this
            ->actingAs($user)
            ->patch(route('companies.update', $company), [
                'name' => 'Updated Name',
            ]);

        $response->assertRedirect(route('companies.edit', $company->fresh()));

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_companies_cannot_be_updated_by_members()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($member)
            ->patch(route('companies.update', $company), [
                'name' => 'Updated Name',
            ]);

        $response->assertForbidden();
    }

    public function test_companies_can_be_deleted_by_owners()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.destroy', $company), [
                'name' => $company->name,
            ]);

        $response->assertRedirect();

        $this->assertSoftDeleted('companies', [
            'id' => $company->id,
        ]);
    }

    public function test_company_deletion_requires_name_confirmation()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.destroy', $company), [
                'name' => 'Wrong Name',
            ]);

        $response->assertSessionHasErrors('name');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'deleted_at' => null,
        ]);
    }

    public function test_deleting_current_company_switches_to_alphabetically_first_remaining_company()
    {
        $user = User::factory()->create(['name' => 'Mike']);

        $zuluCompany = Company::factory()->create(['name' => 'Zulu Company']);
        $zuluCompany->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $alphaCompany = Company::factory()->create(['name' => 'Alpha Company']);
        $alphaCompany->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $betaCompany = Company::factory()->create(['name' => 'Beta Company']);
        $betaCompany->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $user->update(['current_company_id' => $zuluCompany->id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.destroy', $zuluCompany), [
                'name' => $zuluCompany->name,
            ]);

        $response->assertRedirect();

        $this->assertSoftDeleted('companies', [
            'id' => $zuluCompany->id,
        ]);

        $this->assertEquals($alphaCompany->id, $user->fresh()->current_company_id);
    }

    public function test_deleting_current_company_falls_back_to_personal_company_when_alphabetically_first()
    {
        $user = User::factory()->create();
        $personalCompany = $user->personalCompany();
        $company = Company::factory()->create(['name' => 'Zulu Company']);
        $company->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $user->update(['current_company_id' => $company->id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.destroy', $company), [
                'name' => $company->name,
            ]);

        $response->assertRedirect();

        $this->assertSoftDeleted('companies', [
            'id' => $company->id,
        ]);

        $this->assertEquals($personalCompany->id, $user->fresh()->current_company_id);
    }

    public function test_deleting_non_current_company_leaves_current_company_unchanged()
    {
        $user = User::factory()->create();
        $personalCompany = $user->personalCompany();
        $company = Company::factory()->create();
        $company->members()->attach($user, ['role' => CompanyRole::Owner->value]);

        $user->update(['current_company_id' => $personalCompany->id]);

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.destroy', $company), [
                'name' => $company->name,
            ]);

        $response->assertRedirect();

        $this->assertSoftDeleted('companies', [
            'id' => $company->id,
        ]);

        $this->assertEquals($personalCompany->id, $user->fresh()->current_company_id);
    }

    public function test_members_can_leave_non_personal_companies()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($member)
            ->delete(route('companies.leave', $company));

        $response->assertRedirect(route('companies.index'));
        $response->assertInertiaFlash('toast', ['type' => 'success', 'message' => "You left the company \"{$company->name}\""]);

        $this->assertFalse($member->fresh()->belongsToCompany($company));
    }

    public function test_leaving_current_company_switches_to_alphabetically_first_remaining_company()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create(['name' => 'Mike']);

        $zuluCompany = Company::factory()->create(['name' => 'Zulu Company']);
        $zuluCompany->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $zuluCompany->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $alphaCompany = Company::factory()->create(['name' => 'Alpha Company']);
        $alphaCompany->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $betaCompany = Company::factory()->create(['name' => 'Beta Company']);
        $betaCompany->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $member->update(['current_company_id' => $zuluCompany->id]);

        $response = $this
            ->actingAs($member)
            ->delete(route('companies.leave', $zuluCompany));

        $response->assertRedirect(route('companies.index'));

        $this->assertFalse($member->fresh()->belongsToCompany($zuluCompany));
        $this->assertEquals($alphaCompany->id, $member->fresh()->current_company_id);
    }

    public function test_personal_companies_cannot_be_left()
    {
        $user = User::factory()->create();
        $personalCompany = $user->personalCompany();

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.leave', $personalCompany));

        $response->assertForbidden();

        $this->assertTrue($user->fresh()->belongsToCompany($personalCompany));
    }

    public function test_company_owners_cannot_leave_their_company()
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $response = $this
            ->actingAs($owner)
            ->delete(route('companies.leave', $company));

        $response->assertForbidden();

        $this->assertTrue($owner->fresh()->belongsToCompany($company));
    }

    public function test_users_cannot_leave_companies_they_dont_belong_to()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.leave', $company));

        $response->assertForbidden();
    }

    public function test_deleting_company_switches_other_affected_users_to_their_personal_company()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $company = Company::factory()->create();
        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $owner->update(['current_company_id' => $company->id]);
        $member->update(['current_company_id' => $company->id]);

        $response = $this
            ->actingAs($owner)
            ->delete(route('companies.destroy', $company), [
                'name' => $company->name,
            ]);

        $response->assertRedirect();

        $this->assertEquals($member->personalCompany()->id, $member->fresh()->current_company_id);
    }

    public function test_personal_companies_cannot_be_deleted()
    {
        $user = User::factory()->create();

        $personalCompany = $user->personalCompany();

        $response = $this
            ->actingAs($user)
            ->delete(route('companies.destroy', $personalCompany), [
                'name' => $personalCompany->name,
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('companies', [
            'id' => $personalCompany->id,
            'deleted_at' => null,
        ]);
    }

    public function test_companies_cannot_be_deleted_by_non_owners()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($member)
            ->delete(route('companies.destroy', $company), [
                'name' => $company->name,
            ]);

        $response->assertForbidden();
    }

    public function test_users_can_switch_companies()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($user, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($user)
            ->post(route('companies.switch', $company));

        $response->assertRedirect();

        $this->assertEquals($company->id, $user->fresh()->current_company_id);
    }

    public function test_users_cannot_switch_to_company_they_dont_belong_to()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('companies.switch', $company));

        $response->assertForbidden();
    }

    public function test_guests_cannot_access_companies()
    {
        $response = $this->get(route('companies.index'));

        $response->assertRedirect(route('login'));
    }
}
