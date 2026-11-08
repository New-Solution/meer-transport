<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use App\Support\DriverHelpers;
use Database\Factories\DriverFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property string $first_name
 * @property string $last_name
 * @property string|null $nationality
 * @property string|null $license_no
 * @property Carbon|null $license_expiry
 * @property string|null $saudi_id_iqama_no
 * @property Carbon|null $id_iqama_expiry
 * @property string|null $mobile_phone_1
 * @property string|null $mobile_phone_2
 * @property string|null $home_city
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Company $company
 */
class Driver extends Model
{
    /** @use HasFactory<DriverFactory> */
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'nationality',
        'license_no',
        'license_expiry',
        'saudi_id_iqama_no',
        'id_iqama_expiry',
        'mobile_phone_1',
        'mobile_phone_2',
        'home_city',
    ];

    protected function casts(): array
    {
        return [
            'license_expiry' => 'date:Y-m-d',
            'id_iqama_expiry' => 'date:Y-m-d',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Driver $driver) {
            $driver->saudi_id_iqama_no = DriverHelpers::normalizeSaudiIdIqama($driver->saudi_id_iqama_no);
            $driver->mobile_phone_1 = DriverHelpers::cleanPhoneNumber($driver->mobile_phone_1);
            $driver->mobile_phone_2 = DriverHelpers::cleanPhoneNumber($driver->mobile_phone_2);
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
