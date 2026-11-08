<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Database\Factories\ContractRouteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property int $contract_id
 * @property string $from_city
 * @property string $to_city
 * @property int|null $destination_id
 * @property string $vehicle_type
 * @property int $price_halalas
 * @property int $sort_order
 * @property int $return_price_halalas
 * @property int $stay_price_halalas
 * @property int $stop_price_halalas
 * @property int $additional_price_halalas
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Company $company
 * @property-read Contract $contract
 * @property-read Destination|null $destination
 */
class ContractRoute extends Model
{
    /** @use HasFactory<ContractRouteFactory> */
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'contract_id',
        'from_city',
        'to_city',
        'destination_id',
        'vehicle_type',
        'price_halalas',
        'sort_order',
        'return_price_halalas',
        'stay_price_halalas',
        'stop_price_halalas',
        'additional_price_halalas',
    ];

    /**
     * @return BelongsTo<Contract, $this>
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    /**
     * @return BelongsTo<Destination, $this>
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }
}
