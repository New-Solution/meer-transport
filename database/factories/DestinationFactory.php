<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Destination;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Destination>
 */
class DestinationFactory extends Factory
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
            'name' => fake()->unique()->city(),
            'google_maps_url' => 'https://maps.google.com/?q='.fake()->latitude().','.fake()->longitude(),
        ];
    }
}
