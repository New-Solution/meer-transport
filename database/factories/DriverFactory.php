<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Driver;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Driver>
 */
class DriverFactory extends Factory
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
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'nationality' => fake()->country(),
            'license_no' => (string) fake()->unique()->numberBetween(100000, 999999),
            'license_expiry' => fake()->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
            'saudi_id_iqama_no' => (string) fake()->unique()->numerify('##########'),
            'id_iqama_expiry' => fake()->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
            'mobile_phone_1' => '05'.fake()->numerify('########'),
            'mobile_phone_2' => null,
            'home_city' => fake()->randomElement(['Riyadh', 'Jeddah', 'Dammam']),
        ];
    }
}
