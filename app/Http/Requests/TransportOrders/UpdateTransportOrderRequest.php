<?php

namespace App\Http\Requests\TransportOrders;

use App\Http\Requests\TransportOrders\Concerns\ValidatesTransportOrder;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTransportOrderRequest extends FormRequest
{
    use ValidatesTransportOrder;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('transport_order'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->orderRules();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(fn (Validator $validator) => $this->validateOrderBusinessRules($validator));
    }
}
