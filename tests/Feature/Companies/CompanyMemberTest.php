<?php

namespace Tests\Feature\Companies;

use App\Enums\BusinessRole;
use App\Enums\CompanyRole;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyMemberTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_member_roles_can_be_updated_by_owners()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($owner)
            ->patch(route('companies.members.update', [$company, $member]), [
                'role' => CompanyRole::Admin->value,
            ]);

        $response->assertRedirect(route('companies.edit', $company));

        $this->assertEquals(
            CompanyRole::Admin->value,
            $company->members()->where('user_id', $member->id)->first()->pivot->role->value,
        );
    }

    public function test_company_member_roles_cannot_be_updated_by_non_owners()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($admin, ['role' => CompanyRole::Admin->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($admin)
            ->patch(route('companies.members.update', [$company, $member]), [
                'role' => CompanyRole::Admin->value,
            ]);

        $response->assertForbidden();
    }

    public function test_company_members_can_be_removed_by_owners()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($owner)
            ->delete(route('companies.members.destroy', [$company, $member]));

        $response->assertRedirect(route('companies.edit', $company));

        $this->assertFalse($member->fresh()->belongsToCompany($company));
    }

    public function test_company_members_cannot_be_removed_by_non_owners()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($admin, ['role' => CompanyRole::Admin->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($admin)
            ->delete(route('companies.members.destroy', [$company, $member]));

        $response->assertForbidden();
    }

    public function test_company_owner_cannot_be_removed()
    {
        $owner = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $response = $this
            ->actingAs($owner)
            ->delete(route('companies.members.destroy', [$company, $owner]));

        $response->assertForbidden();

        $this->assertTrue($owner->fresh()->belongsToCompany($company));
    }

    public function test_company_member_role_cannot_be_set_to_owner()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($owner)
            ->patch(route('companies.members.update', [$company, $member]), [
                'role' => CompanyRole::Owner->value,
            ]);

        $response->assertSessionHasErrors('role');

        $this->assertEquals(
            CompanyRole::Member->value,
            $company->members()->where('user_id', $member->id)->first()->pivot->role->value,
        );
    }

    public function test_company_member_business_role_can_be_updated_by_owners()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($owner)
            ->patch(route('companies.members.updateBusinessRole', [$company, $member]), [
                'business_role' => BusinessRole::OperationsManager->value,
            ]);

        $response->assertRedirect(route('companies.edit', $company));

        $this->assertEquals(
            BusinessRole::OperationsManager->value,
            $company->members()->where('user_id', $member->id)->first()->pivot->business_role->value,
        );
    }

    public function test_company_member_business_role_cannot_be_updated_by_non_owners()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($admin, ['role' => CompanyRole::Admin->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($admin)
            ->patch(route('companies.members.updateBusinessRole', [$company, $member]), [
                'business_role' => BusinessRole::OperationsManager->value,
            ]);

        $response->assertForbidden();
    }

    public function test_company_member_business_role_must_be_a_valid_option()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $response = $this
            ->actingAs($owner)
            ->patch(route('companies.members.updateBusinessRole', [$company, $member]), [
                'business_role' => 'super_admin',
            ]);

        $response->assertSessionHasErrors('business_role');
    }

    public function test_removed_member_current_company_is_set_to_personal_company()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $personalCompany = $member->personalCompany();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);
        $company->members()->attach($member, ['role' => CompanyRole::Member->value]);

        $member->update(['current_company_id' => $company->id]);

        $this
            ->actingAs($owner)
            ->delete(route('companies.members.destroy', [$company, $member]));

        $this->assertEquals($personalCompany->id, $member->fresh()->current_company_id);
    }
}
