<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Models\Concerns\BelongsToCompany;
use Database\Factories\TransportOrderFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property string $order_number
 * @property Carbon $order_date
 * @property Carbon $required_delivery_date
 * @property int $customer_id
 * @property array<string, mixed> $customer_snapshot
 * @property int $contract_id
 * @property array<string, mixed> $contract_snapshot
 * @property int $contract_route_id
 * @property array<string, mixed> $route_snapshot
 * @property string|null $customer_po_number
 * @property int $applied_price_halalas
 * @property bool $price_overridden
 * @property string|null $override_reason
 * @property string|null $override_authorized_by
 * @property Carbon|null $override_authorized_at
 * @property int $trip_count
 * @property int $total_amount_halalas
 * @property array<int, array<string, mixed>> $additional_charges
 * @property string $currency
 * @property OrderStatus $status
 * @property array<string, mixed>|null $cargo_details
 * @property string|null $loading_instructions
 * @property string|null $delivery_instructions
 * @property string|null $internal_remarks
 * @property Carbon|null $confirmed_at
 * @property string|null $confirmed_by
 * @property Carbon|null $cancelled_at
 * @property string|null $cancelled_by
 * @property string|null $cancellation_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Company $company
 * @property-read Customer $customer
 * @property-read Contract $contract
 * @property-read ContractRoute $contractRoute
 * @property-read Collection<int, TransportTrip> $trips
 */
class TransportOrder extends Model
{
    /** @use HasFactory<TransportOrderFactory> */
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'order_number',
        'order_date',
        'required_delivery_date',
        'customer_id',
        'customer_snapshot',
        'contract_id',
        'contract_snapshot',
        'contract_route_id',
        'route_snapshot',
        'customer_po_number',
        'applied_price_halalas',
        'price_overridden',
        'override_reason',
        'override_authorized_by',
        'override_authorized_at',
        'trip_count',
        'total_amount_halalas',
        'additional_charges',
        'status',
        'cargo_details',
        'loading_instructions',
        'delivery_instructions',
        'internal_remarks',
        'confirmed_at',
        'confirmed_by',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date:Y-m-d',
            'required_delivery_date' => 'date:Y-m-d',
            'customer_snapshot' => 'array',
            'contract_snapshot' => 'array',
            'route_snapshot' => 'array',
            'price_overridden' => 'boolean',
            'override_authorized_at' => 'datetime',
            'additional_charges' => 'array',
            'status' => OrderStatus::class,
            'cargo_details' => 'array',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<Contract, $this>
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    /**
     * @return BelongsTo<ContractRoute, $this>
     */
    public function contractRoute(): BelongsTo
    {
        return $this->belongsTo(ContractRoute::class);
    }

    /**
     * @return HasMany<TransportTrip, $this>
     */
    public function trips(): HasMany
    {
        return $this->hasMany(TransportTrip::class, 'order_id')->orderBy('sequence_number');
    }
}
