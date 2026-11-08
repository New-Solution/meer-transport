<?php

namespace App\Http\Controllers;

use App\Enums\ContractStatus;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\Contract;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, Company $current_company): Response
    {
        $email = strtolower($request->user()->email);

        $pendingInvitations = CompanyInvitation::query()
            ->with(['inviter', 'company'])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (CompanyInvitation $invitation) => [
                'code' => $invitation->code,
                'inviterName' => $invitation->inviter->name,
                'company' => [
                    'name' => $invitation->company->name,
                    'slug' => $invitation->company->slug,
                ],
            ]);

        $contracts = Contract::query()->whereNull('archived_at')
            ->orderByDesc('contract_date')
            ->orderBy('contract_number')
            ->get();

        $resolved = $contracts->map(fn (Contract $contract) => [
            'contract' => $contract,
            'status' => $contract->resolvedStatus(),
        ]);

        $counts = [
            'DRAFT' => 0,
            'ACTIVE' => 0,
            'EXPIRED' => 0,
            'CANCELLED' => 0,
        ];
        foreach ($resolved as $entry) {
            $counts[$entry['status']->value]++;
        }

        $today = Carbon::today();

        $upcomingExpirations = $resolved
            ->filter(fn (array $entry) => $entry['status'] === ContractStatus::Active)
            ->map(function (array $entry) use ($today) {
                $daysRemaining = $today->diffInDays($entry['contract']->expiry_date, false);

                return [
                    'contract' => $entry['contract'],
                    'daysRemaining' => (int) $daysRemaining,
                ];
            })
            ->filter(fn (array $entry) => $entry['daysRemaining'] >= 0 && $entry['daysRemaining'] <= 30)
            ->sortBy(fn (array $entry) => sprintf('%05d-%s', $entry['daysRemaining'], $entry['contract']->contract_number))
            ->values();

        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
            'metrics' => [
                'totalCustomers' => Customer::query()->active()->count(),
                'totalContracts' => $contracts->count(),
                'activeContracts' => $counts['ACTIVE'],
                'expiredContracts' => $counts['EXPIRED'],
                'draftContracts' => $counts['DRAFT'],
                'cancelledContracts' => $counts['CANCELLED'],
            ],
            'recentContracts' => $contracts->take(6)->map(fn (Contract $contract) => $this->toContractSummary($contract)),
            'upcomingExpirations' => $upcomingExpirations->map(fn (array $entry) => [
                ...$this->toContractSummary($entry['contract']),
                'days_remaining' => $entry['daysRemaining'],
            ]),
            'canCreateContract' => Gate::allows('create', Contract::class),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function toContractSummary(Contract $contract): array
    {
        return [
            'id' => $contract->id,
            'contract_number' => $contract->contract_number,
            'customer_name' => $contract->customer_snapshot['name'],
            'customer_cr_number' => $contract->customer_snapshot['cr_number'],
            'contract_date' => $contract->contract_date->toDateString(),
            'expiry_date' => $contract->expiry_date->toDateString(),
            'routes_count' => $contract->routes()->count(),
            'status' => $contract->resolvedStatus()->value,
        ];
    }
}
