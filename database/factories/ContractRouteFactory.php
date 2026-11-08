<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Contract;
use App\Models\ContractRoute;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContractRoute>
 */
class ContractRouteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'contract_id' => Contract::factory(),
            'from_city' => 'Riyadh',
            'to_city' => 'Jeddah',
            'vehicle_type' => 'Truck',
            'price_halalas' => 350000,
            'sort_order' => 1,
            'return_price_halalas' => 0,
            'stay_price_halalas' => 0,
            'stop_price_halalas' => 0,
            'additional_price_halalas' => 0,
        ];
    }
}
