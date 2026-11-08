<?php

namespace App\Http\Requests\Contracts;

use App\Http\Requests\Contracts\Concerns\ValidatesContractRoutes;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractRequest extends FormRequest
{
    use ValidatesContractRoutes;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('contract'));
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'contract_number' => strtoupper(trim((string) $this->input('contract_number'))),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'contract_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('contracts')
                    ->where('company_id', $this->user()->current_company_id)
                    ->ignore($this->route('contract')),
            ],
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')
                    ->where('company_id', $this->user()->current_company_id)
                    ->whereNull('archived_at'),
            ],
            'contract_date' => ['required', 'date_format:Y-m-d'],
            'expiry_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:contract_date'],
            ...$this->routeRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(fn (Validator $validator) => $this->validateRouteBusinessRules($validator));
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'contract_number.unique' => 'This contract number is already in use by another contract.',
            'customer_id.exists' => 'The selected customer does not exist or is archived.',
            'expiry_date.after_or_equal' => 'Expiry date cannot be earlier than the contract date.',
        ];
    }
}
