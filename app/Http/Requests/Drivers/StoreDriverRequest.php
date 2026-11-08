<?php

namespace App\Http\Requests\Drivers;

use App\Models\Driver;
use App\Rules\ValidMobilePhone;
use App\Support\DriverHelpers;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Driver::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'saudi_id_iqama_no' => DriverHelpers::normalizeSaudiIdIqama($this->input('saudi_id_iqama_no')),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'license_no' => ['nullable', 'string', 'max:50'],
            'license_expiry' => ['nullable', 'date_format:Y-m-d'],
            'saudi_id_iqama_no' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('drivers')->where('company_id', $this->user()->current_company_id),
            ],
            'id_iqama_expiry' => ['nullable', 'date_format:Y-m-d'],
            'mobile_phone_1' => ['nullable', 'string', new ValidMobilePhone],
            'mobile_phone_2' => ['nullable', 'string', new ValidMobilePhone],
            'home_city' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'saudi_id_iqama_no.unique' => 'This Saudi ID / Iqama number already exists in this company.',
        ];
    }
}
