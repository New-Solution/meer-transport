<?php

namespace Database\Factories;

use App\Enums\ContractStatus;
use App\Models\Company;
use App\Models\Contract;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contract>
 */
class ContractFactory extends Factory
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
            'contract_number' => 'TC-'.fake()->unique()->numberBetween(1000, 999999),
            'customer_id' => Customer::factory(),
            'customer_snapshot' => [
                'id' => 1,
                'name' => 'Snapshot Customer',
                'cr_number' => '1234567890',
                'unified_number' => '7001234567',
                'vat_number' => '310123456700003',
                'address' => 'Riyadh, Saudi Arabia',
                'snapshot_at' => now()->toIso8601String(),
            ],
            'contract_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'status' => ContractStatus::Active,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContractStatus::Draft,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContractStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => 'Test User',
            'cancellation_reason' => 'Test cancellation',
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'contract_date' => now()->subYears(2)->format('Y-m-d'),
            'expiry_date' => now()->subYear()->format('Y-m-d'),
        ]);
    }
}
