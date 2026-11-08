<?php

namespace Database\Factories;

use App\Enums\TruckVehicleType;
use App\Enums\TruckWeightType;
use App\Models\Company;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Truck>
 */
class TruckFactory extends Factory
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
            'weight_type' => fake()->randomElement(TruckWeightType::cases()),
            'vehicle_type' => fake()->randomElement(TruckVehicleType::cases()),
            'license_plate' => strtoupper(fake()->unique()->bothify('### ???')),
            'is_external' => true,
            'is_internal' => false,
        ];
    }
}
