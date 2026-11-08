<?php

namespace App\Http\Requests\TransportOrders;

use App\Http\Requests\TransportOrders\Concerns\ValidatesTransportOrder;
use App\Models\TransportOrder;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransportOrderRequest extends FormRequest
{
    use ValidatesTransportOrder;

    public function authorize(): bool
    {
        return $this->user()->can('create', TransportOrder::class);
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('order_number')) {
            $this->merge(['order_number' => strtoupper(trim((string) $this->input('order_number')))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->orderRules(),
            'order_number' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('transport_orders', 'order_number')->where('company_id', $this->user()->current_company_id),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(fn (Validator $validator) => $this->validateOrderBusinessRules($validator));
    }
}
