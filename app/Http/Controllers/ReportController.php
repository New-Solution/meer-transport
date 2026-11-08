<?php

namespace App\Http\Controllers;

use App\Enums\ContractStatus;
use App\Models\Company;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private const TABS = ['customer-contracts', 'active-contracts', 'expired-contracts', 'contract-routes'];

    public function index(Request $request, Company $current_company): Response
    {
        Gate::authorize('viewReports');

        $tab = $this->resolveTab($request);
        $filters = $this->resolveFilters($request);

        return Inertia::render('reports/index', [
            'activeTab' => $tab,
            'rows' => $this->rowsForTab($tab, $filters),
            'filters' => $filters,
            'customers' => Customer::query()->orderBy('name')->get(['id', 'name', 'cr_number'])
                ->map(fn (Customer $customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'cr_number' => $customer->cr_number,
                ]),
        ]);
    }

    public function download(Request $request, Company $current_company): StreamedResponse
    {
        Gate::authorize('viewReports');

        $tab = $this->resolveTab($request);
        $rows = $this->rowsForTab($tab, $this->resolveFilters($request));

        $headers = $tab === 'contract-routes'
            ? ['Contract Number', 'Customer Name', 'From City', 'To City', 'Vehicle Type', 'Price (SAR)', 'Contract Status']
            : ['Contract Number', 'Customer Name', 'CR Number', 'Contract Date', 'Expiry Date', 'Number of Routes', 'Status'];

        $filename = "{$tab}-{$current_company->slug}.csv";

        return response()->streamDownload(function () use ($rows, $headers, $tab) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                throw new RuntimeException('Unable to open output stream for CSV export.');
            }

            fputcsv($handle, $headers);

            foreach ($rows as $row) {
                fputcsv($handle, $tab === 'contract-routes' ? [
                    $row['contract_number'],
                    $row['customer_name'],
                    $row['from_city'],
                    $row['to_city'],
                    $row['vehicle_type'],
                    number_format($row['price'], 2, '.', ''),
                    $row['contract_status'],
                ] : [
                    $row['contract_number'],
                    $row['customer_name'],
                    $row['customer_cr_number'],
                    $row['contract_date'],
                    $row['expiry_date'],
                    $row['routes_count'],
                    $row['status'],
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function resolveTab(Request $request): string
    {
        $tab = $request->string('tab')->toString();

        return in_array($tab, self::TABS, strict: true) ? $tab : 'customer-contracts';
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveFilters(Request $request): array
    {
        return [
            'customer_id' => $request->integer('customer_id') ?: null,
            'from_date' => $request->string('from_date')->toString(),
            'to_date' => $request->string('to_date')->toString(),
            'status' => $request->string('status')->toString() ?: 'ALL',
            'contract_number' => $request->string('contract_number')->toString(),
            'from_city' => $request->string('from_city')->toString(),
            'to_city' => $request->string('to_city')->toString(),
            'vehicle_type' => $request->string('vehicle_type')->toString() ?: 'ALL',
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function rowsForTab(string $tab, array $filters): array
    {
        return match ($tab) {
            'active-contracts' => $this->activeContractsRows(),
            'expired-contracts' => $this->expiredContractsRows(),
            'contract-routes' => $this->contractRoutesRows($filters),
            default => $this->customerContractsRows($filters),
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function customerContractsRows(array $filters): array
    {
        $query = Contract::query()->whereNull('archived_at');

        if ($filters['customer_id']) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if ($filters['from_date']) {
            $query->whereDate('contract_date', '>=', $filters['from_date']);
        }

        if ($filters['to_date']) {
            $query->whereDate('contract_date', '<=', $filters['to_date']);
        }

        $contracts = $query->latest('contract_date')->get();

        if ($filters['status'] !== 'ALL') {
            $contracts = $contracts->filter(fn (Contract $contract) => $contract->resolvedStatus()->value === $filters['status'])->values();
        }

        return $this->toCustomerContractsReportRows($contracts);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function activeContractsRows(): array
    {
        $contracts = Contract::query()->eligibleForOrders()->get();

        return $this->toCustomerContractsReportRows($contracts);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function expiredContractsRows(): array
    {
        $contracts = Contract::query()->whereNull('archived_at')->get()
            ->filter(fn (Contract $contract) => $contract->resolvedStatus() === ContractStatus::Expired)
            ->values();

        return $this->toCustomerContractsReportRows($contracts);
    }

    /**
     * @param  EloquentCollection<int, Contract>  $contracts
     * @return array<int, array<string, mixed>>
     */
    private function toCustomerContractsReportRows(EloquentCollection $contracts): array
    {
        return $contracts->map(fn (Contract $contract) => [
            'contract_id' => $contract->id,
            'contract_number' => $contract->contract_number,
            'customer_id' => $contract->customer_id,
            'customer_name' => $contract->customer_snapshot['name'],
            'customer_cr_number' => $contract->customer_snapshot['cr_number'],
            'contract_date' => $contract->contract_date->toDateString(),
            'expiry_date' => $contract->expiry_date->toDateString(),
            'routes_count' => $contract->routes()->count(),
            'status' => $contract->resolvedStatus()->value,
        ])->values()->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function contractRoutesRows(array $filters): array
    {
        $contracts = Contract::query()->whereNull('archived_at')->get()->keyBy('id');

        $query = ContractRoute::query()->whereIn('contract_id', $contracts->keys());

        if ($filters['from_city']) {
            $query->where('from_city', 'like', '%'.$filters['from_city'].'%');
        }

        if ($filters['to_city']) {
            $query->where('to_city', 'like', '%'.$filters['to_city'].'%');
        }

        if ($filters['vehicle_type'] !== 'ALL') {
            $query->where('vehicle_type', $filters['vehicle_type']);
        }

        $rows = $query->get()
            ->map(function (ContractRoute $route) use ($contracts) {
                $contract = $contracts->get($route->contract_id);

                return [
                    'route_id' => $route->id,
                    'contract_id' => $contract->id,
                    'contract_number' => $contract->contract_number,
                    'customer_id' => $contract->customer_id,
                    'customer_name' => $contract->customer_snapshot['name'],
                    'from_city' => $route->from_city,
                    'to_city' => $route->to_city,
                    'vehicle_type' => $route->vehicle_type,
                    'price' => $route->price_halalas / 100,
                    'contract_status' => $contract->resolvedStatus()->value,
                ];
            });

        if ($filters['customer_id']) {
            $rows = $rows->filter(fn (array $row) => $row['customer_id'] === $filters['customer_id']);
        }

        if ($filters['contract_number']) {
            $needle = mb_strtolower($filters['contract_number']);
            $rows = $rows->filter(fn (array $row) => str_contains(mb_strtolower($row['contract_number']), $needle));
        }

        if ($filters['status'] !== 'ALL') {
            $rows = $rows->filter(fn (array $row) => $row['contract_status'] === $filters['status']);
        }

        return $rows->sortBy([
            ['contract_number', 'asc'],
            ['from_city', 'asc'],
            ['to_city', 'asc'],
        ])->values()->all();
    }
}
