<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
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
            'name' => fake()->company(),
            'cr_number' => (string) fake()->unique()->numberBetween(1000000000, 9999999999),
            'unified_number' => (string) fake()->unique()->numberBetween(7000000000, 7999999999),
            'vat_number' => (string) fake()->unique()->numerify('###############'),
            'address' => fake()->address(),
            'archived_at' => null,
        ];
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'archived_at' => now(),
        ]);
    }
}
