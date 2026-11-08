<?php

namespace App\Actions\Contracts;

use App\Models\Contract;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class CreateContract
{
    /**
     * @param  array<string, mixed>  $data  Validated contract fields (contract_number, customer_id, contract_date, expiry_date, status).
     * @param  array<int, array<string, mixed>>  $routes  Normalized routes (see ValidatesContractRoutes::normalizedRoutes()).
     */
    public function handle(array $data, array $routes): Contract
    {
        return DB::transaction(function () use ($data, $routes) {
            $customer = Customer::query()->whereKey($data['customer_id'])->firstOrFail();

            $contract = Contract::create([
                'contract_number' => $data['contract_number'],
                'customer_id' => $customer->id,
                'customer_snapshot' => $this->snapshotCustomer($customer),
                'contract_date' => $data['contract_date'],
                'expiry_date' => $data['expiry_date'],
                'status' => $data['status'],
            ]);

            $contract->routes()->createMany($routes);

            return $contract->load('routes');
        });
    }

    /**
     * @return array<string, mixed>
     */
    public static function snapshotCustomer(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'cr_number' => $customer->cr_number,
            'unified_number' => $customer->unified_number,
            'vat_number' => $customer->vat_number,
            'address' => $customer->address,
            'snapshot_at' => now()->toIso8601String(),
        ];
    }
}
