<?php

namespace App\Models;

use App\Enums\TruckVehicleType;
use App\Enums\TruckWeightType;
use App\Models\Concerns\BelongsToCompany;
use App\Support\LicensePlate;
use Database\Factories\TruckFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property TruckWeightType $weight_type
 * @property TruckVehicleType $vehicle_type
 * @property string $license_plate
 * @property string $normalized_license_plate
 * @property bool $is_external
 * @property bool $is_internal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Company $company
 */
class Truck extends Model
{
    /** @use HasFactory<TruckFactory> */
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'weight_type',
        'vehicle_type',
        'license_plate',
        'is_external',
        'is_internal',
    ];

    protected function casts(): array
    {
        return [
            'weight_type' => TruckWeightType::class,
            'vehicle_type' => TruckVehicleType::class,
            'is_external' => 'boolean',
            'is_internal' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Truck $truck) {
            $truck->license_plate = LicensePlate::clean($truck->license_plate);
            $truck->normalized_license_plate = LicensePlate::normalize($truck->license_plate);
        });
    }

    /**
     * @return HasMany<TransportTrip, $this>
     */
    public function trips(): HasMany
    {
        return $this->hasMany(TransportTrip::class);
    }
}
