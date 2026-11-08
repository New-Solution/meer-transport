<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

/**
 * @implements Scope<Model>
 */
class CompanyScope implements Scope
{
    /**
     * Restrict the query to the authenticated user's current company.
     *
     * When there is no authenticated user (console commands, queued jobs,
     * tests running unauthenticated), the scope is skipped entirely rather
     * than silently filtering to nothing — callers in that context are
     * expected to scope explicitly.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (Auth::check() && Auth::user()->current_company_id) {
            $builder->where($model->qualifyColumn('company_id'), Auth::user()->current_company_id);
        }
    }
}
