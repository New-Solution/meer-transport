<?php

namespace App\Http\Requests\Contracts;

use App\Http\Requests\Contracts\Concerns\ValidatesContractRoutes;
use App\Models\Contract;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContractRequest extends FormRequest
{
    use ValidatesContractRoutes;

    public function authorize(): bool
    {
        return $this->user()->can('create', Contract::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'contract_number' => strtoupper(trim((string) $this->input('contract_number'))),
            'status' => $this->input('status') ?: 'ACTIVE',
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
                Rule::unique('contracts')->where('company_id', $this->user()->current_company_id),
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
            'status' => ['required', Rule::in(['DRAFT', 'ACTIVE'])],
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
            'contract_number.unique' => 'This contract number already exists for this company.',
            'customer_id.exists' => 'The selected customer does not exist or is archived.',
            'expiry_date.after_or_equal' => 'Expiry date cannot be earlier than the contract date.',
        ];
    }
}
