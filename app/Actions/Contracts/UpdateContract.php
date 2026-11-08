<?php

namespace App\Actions\Contracts;

use App\Models\Contract;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class UpdateContract
{
    /**
     * @param  array<string, mixed>  $data  Validated contract fields (contract_number, customer_id, contract_date, expiry_date).
     * @param  array<int, array<string, mixed>>  $routes  Normalized routes (see ValidatesContractRoutes::normalizedRoutes()).
     */
    public function handle(Contract $contract, array $data, array $routes): Contract
    {
        return DB::transaction(function () use ($contract, $data, $routes) {
            $attributes = [
                'contract_number' => $data['contract_number'],
                'contract_date' => $data['contract_date'],
                'expiry_date' => $data['expiry_date'],
            ];

            if ($data['customer_id'] !== $contract->customer_id) {
                $customer = Customer::query()->whereKey($data['customer_id'])->firstOrFail();
                $attributes['customer_id'] = $customer->id;
                $attributes['customer_snapshot'] = CreateContract::snapshotCustomer($customer);
            }

            $contract->update($attributes);

            // Replace the full route set atomically, matching the original
            // app's "full replace" semantics rather than diffing in place.
            $contract->routes()->delete();
            $contract->routes()->createMany($routes);

            return $contract->fresh('routes');
        });
    }
}
