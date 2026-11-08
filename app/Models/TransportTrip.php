<?php

namespace App\Models;

use App\Enums\TripStatus;
use App\Models\Concerns\BelongsToCompany;
use Database\Factories\TransportTripFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property int $order_id
 * @property string $trip_number
 * @property int $sequence_number
 * @property TripStatus $status
 * @property string $from_city
 * @property string $to_city
 * @property string $vehicle_type
 * @property int $applied_price_halalas
 * @property Carbon $planned_pickup_date
 * @property Carbon $planned_delivery_date
 * @property array<string, mixed>|null $cargo_details
 * @property string|null $special_notes
 * @property int|null $truck_id
 * @property int|null $driver_id
 * @property int $truck_amount_halalas
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Company $company
 * @property-read TransportOrder $order
 * @property-read Truck|null $truck
 * @property-read Driver|null $driver
 */
class TransportTrip extends Model
{
    /** @use HasFactory<TransportTripFactory> */
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'order_id',
        'trip_number',
        'sequence_number',
        'status',
        'from_city',
        'to_city',
        'vehicle_type',
        'applied_price_halalas',
        'planned_pickup_date',
        'planned_delivery_date',
        'cargo_details',
        'special_notes',
        'truck_id',
        'driver_id',
        'truck_amount_halalas',
    ];

    protected function casts(): array
    {
        return [
            'status' => TripStatus::class,
            'planned_pickup_date' => 'date:Y-m-d',
            'planned_delivery_date' => 'date:Y-m-d',
            'cargo_details' => 'array',
        ];
    }

    /**
     * @return BelongsTo<TransportOrder, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(TransportOrder::class, 'order_id');
    }

    /**
     * @return BelongsTo<Truck, $this>
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
