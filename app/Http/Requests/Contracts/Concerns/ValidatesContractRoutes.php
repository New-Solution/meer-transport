<?php

namespace App\Http\Requests\Contracts\Concerns;

use App\Support\Money;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\Rule;

/**
 * Shared route validation/normalization for creating and updating a
 * contract's multi-route tariff table.
 */
trait ValidatesContractRoutes
{
    /**
     * @return array<string, mixed>
     */
    protected function routeRules(): array
    {
        return [
            'routes' => ['required', 'array', 'min:1'],
            'routes.*.id' => ['nullable', 'integer'],
            'routes.*.from_city' => ['required', 'string', 'max:255'],
            'routes.*.to_city' => ['required', 'string', 'max:255'],
            'routes.*.destination_id' => [
                'nullable',
                'integer',
                Rule::exists('destinations', 'id')->where('company_id', $this->user()->current_company_id),
            ],
            'routes.*.vehicle_type' => ['required', Rule::in(['Truck'])],
            'routes.*.price' => ['required', 'numeric', 'min:0.01'],
            'routes.*.return_price' => ['nullable', 'numeric', 'min:0'],
            'routes.*.stay_price' => ['nullable', 'numeric', 'min:0'],
            'routes.*.stop_price' => ['nullable', 'numeric', 'min:0'],
            'routes.*.additional_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function validateRouteBusinessRules(Validator $validator): void
    {
        $routes = $this->input('routes', []);
        $seen = [];

        foreach ($routes as $index => $route) {
            $from = strtolower(trim((string) ($route['from_city'] ?? '')));
            $to = strtolower(trim((string) ($route['to_city'] ?? '')));

            if ($from !== '' && $from === $to) {
                $validator->errors()->add("routes.{$index}.to_city", 'From and To cities cannot be identical.');
            }

            $key = $from.'|'.$to.'|'.($route['vehicle_type'] ?? '').'|'.($route['destination_id'] ?? '');
            if (isset($seen[$key])) {
                $validator->errors()->add("routes.{$index}.from_city", 'Duplicate route detected.');
            }
            $seen[$key] = true;
        }
    }

    /**
     * Normalize each route's SAR price inputs into integer halalas for storage.
     *
     * @return array<int, array<string, mixed>>
     */
    public function normalizedRoutes(): array
    {
        /** @var array<int, array<string, mixed>> $routes */
        $routes = $this->input('routes', []);

        return collect($routes)
            ->values()
            ->map(function (array $route, int $index) {
                return [
                    'id' => $route['id'] ?? null,
                    'from_city' => trim($route['from_city']),
                    'to_city' => trim($route['to_city']),
                    'destination_id' => $route['destination_id'] ?: null,
                    'vehicle_type' => $route['vehicle_type'],
                    'price_halalas' => Money::sarToHalalas($route['price']),
                    'sort_order' => $index + 1,
                    'return_price_halalas' => Money::sarToHalalas($route['return_price'] ?? null),
                    'stay_price_halalas' => Money::sarToHalalas($route['stay_price'] ?? null),
                    'stop_price_halalas' => Money::sarToHalalas($route['stop_price'] ?? null),
                    'additional_price_halalas' => Money::sarToHalalas($route['additional_price'] ?? null),
                ];
            })
            ->all();
    }
}
