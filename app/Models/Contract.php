<?php

namespace App\Models;

use App\Enums\ContractStatus;
use App\Models\Concerns\BelongsToCompany;
use Carbon\CarbonInterface;
use Database\Factories\ContractFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property string $contract_number
 * @property int $customer_id
 * @property array<string, mixed> $customer_snapshot
 * @property Carbon $contract_date
 * @property Carbon $expiry_date
 * @property ContractStatus $status
 * @property Carbon|null $cancelled_at
 * @property string|null $cancelled_by
 * @property string|null $cancellation_reason
 * @property Carbon|null $archived_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Company $company
 * @property-read Customer $customer
 * @property-read Collection<int, ContractRoute> $routes
 */
class Contract extends Model
{
    /** @use HasFactory<ContractFactory> */
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'contract_number',
        'customer_id',
        'customer_snapshot',
        'contract_date',
        'expiry_date',
        'status',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'customer_snapshot' => 'array',
            'contract_date' => 'date:Y-m-d',
            'expiry_date' => 'date:Y-m-d',
            'status' => ContractStatus::class,
            'cancelled_at' => 'datetime',
            'archived_at' => 'datetime',
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
     * @return HasMany<ContractRoute, $this>
     */
    public function routes(): HasMany
    {
        return $this->hasMany(ContractRoute::class)->orderBy('sort_order');
    }

    /**
     * The effective status considering expiry, without persisting it:
     * - CANCELLED and DRAFT contracts never change.
     * - ACTIVE contracts resolve to EXPIRED once past their expiry date.
     * - Expired/cancelled contracts never automatically become active again.
     */
    public function resolvedStatus(?CarbonInterface $asOf = null): ContractStatus
    {
        if ($this->status === ContractStatus::Cancelled || $this->status === ContractStatus::Draft) {
            return $this->status;
        }

        $asOf ??= Carbon::today();

        if ($asOf->toDateString() > $this->expiry_date->toDateString()) {
            return ContractStatus::Expired;
        }

        return $this->status;
    }

    /**
     * Contracts that are currently usable to create transport orders against:
     * stored as ACTIVE, not archived, and within their contract/expiry window.
     *
     * @param  Builder<Contract>  $query
     * @return Builder<Contract>
     */
    public function scopeEligibleForOrders(Builder $query, ?CarbonInterface $asOf = null): Builder
    {
        $asOf ??= Carbon::today();

        return $query->whereNull('archived_at')
            ->where('status', ContractStatus::Active->value)
            ->whereDate('contract_date', '<=', $asOf)
            ->whereDate('expiry_date', '>=', $asOf);
    }
}
