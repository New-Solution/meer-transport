<?php

namespace Database\Factories;

use App\Enums\TripStatus;
use App\Models\Company;
use App\Models\TransportOrder;
use App\Models\TransportTrip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransportTrip>
 */
class TransportTripFactory extends Factory
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
            'order_id' => TransportOrder::factory(),
            'trip_number' => 'TO-TRIP-'.fake()->unique()->numberBetween(1000, 9999),
            'sequence_number' => 1,
            'status' => TripStatus::Draft,
            'from_city' => 'Riyadh',
            'to_city' => 'Jeddah',
            'vehicle_type' => 'Truck',
            'applied_price_halalas' => 350000,
            'planned_pickup_date' => now()->format('Y-m-d'),
            'planned_delivery_date' => now()->addDay()->format('Y-m-d'),
            'truck_amount_halalas' => 0,
        ];
    }
}
