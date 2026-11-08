<?php

namespace Tests\Feature\Companies;

use App\Enums\CompanyRole;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PruneExpiredCompanyInvitationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_expired_invitations_are_deleted_by_the_scheduled_cleanup(): void
    {
        $this->travelTo(now()->startOfDay());

        $owner = User::factory()->create();
        $company = Company::factory()->create();

        $company->members()->attach($owner, ['role' => CompanyRole::Owner->value]);

        $expiredInvitation = CompanyInvitation::factory()->expired()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
        ]);

        $unexpiredInvitation = CompanyInvitation::factory()->expiresIn(1)->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
        ]);

        $invitationWithoutExpiration = CompanyInvitation::factory()->create([
            'company_id' => $company->id,
            'invited_by' => $owner->id,
        ]);

        $this->artisan('schedule:run')->assertSuccessful();

        $this->assertDatabaseMissing('company_invitations', [
            'id' => $expiredInvitation->id,
        ]);

        $this->assertDatabaseHas('company_invitations', [
            'id' => $unexpiredInvitation->id,
        ]);

        $this->assertDatabaseHas('company_invitations', [
            'id' => $invitationWithoutExpiration->id,
        ]);
    }
}
