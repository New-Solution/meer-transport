<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Database\Factories\DestinationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property string $name
 * @property string $google_maps_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Company $company
 */
class Destination extends Model
{
    /** @use HasFactory<DestinationFactory> */
    use BelongsToCompany, HasFactory;

    protected $fillable = ['name', 'google_maps_url'];

    /**
     * @return HasMany<ContractRoute, $this>
     */
    public function contractRoutes(): HasMany
    {
        return $this->hasMany(ContractRoute::class);
    }
}
