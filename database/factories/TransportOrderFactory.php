<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Company;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use App\Models\TransportOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransportOrder>
 */
class TransportOrderFactory extends Factory
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
            'order_number' => 'TO-'.now()->year.'-'.fake()->unique()->numberBetween(1000, 9999),
            'order_date' => now()->format('Y-m-d'),
            'required_delivery_date' => now()->addDays(3)->format('Y-m-d'),
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
            'contract_id' => Contract::factory(),
            'contract_snapshot' => [
                'id' => 1,
                'contract_number' => 'TC-SNAPSHOT',
                'contract_date' => now()->format('Y-m-d'),
                'expiry_date' => now()->addYear()->format('Y-m-d'),
                'snapshot_at' => now()->toIso8601String(),
            ],
            'contract_route_id' => ContractRoute::factory(),
            'route_snapshot' => [
                'id' => 1,
                'from_city' => 'Riyadh',
                'to_city' => 'Jeddah',
                'destination_id' => null,
                'destination_name' => null,
                'destination_google_maps_url' => null,
                'vehicle_type' => 'Truck',
                'original_price_halalas' => 350000,
                'return_price_halalas' => 0,
                'stay_price_halalas' => 0,
                'stop_price_halalas' => 0,
                'additional_price_halalas' => 0,
                'snapshot_at' => now()->toIso8601String(),
            ],
            'applied_price_halalas' => 350000,
            'price_overridden' => false,
            'trip_count' => 1,
            'total_amount_halalas' => 350000,
            'additional_charges' => [
                ['type' => 'return', 'label' => 'Return', 'enabled' => false, 'contract_price_halalas' => 0, 'applied_price_halalas' => 0],
                ['type' => 'stay', 'label' => 'Stay', 'enabled' => false, 'contract_price_halalas' => 0, 'applied_price_halalas' => 0],
                ['type' => 'stop', 'label' => 'Stop', 'enabled' => false, 'contract_price_halalas' => 0, 'applied_price_halalas' => 0],
                ['type' => 'additional', 'label' => 'Additional', 'enabled' => false, 'contract_price_halalas' => 0, 'applied_price_halalas' => 0],
            ],
            'status' => OrderStatus::Draft,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Confirmed,
            'confirmed_at' => now(),
            'confirmed_by' => 'Test User',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => 'Test User',
            'cancellation_reason' => 'Test cancellation',
        ]);
    }
}
