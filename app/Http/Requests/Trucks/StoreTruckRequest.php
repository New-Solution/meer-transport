<?php

namespace App\Http\Requests\Trucks;

use App\Enums\TruckVehicleType;
use App\Enums\TruckWeightType;
use App\Models\Truck;
use App\Support\LicensePlate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTruckRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Truck::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'normalized_license_plate' => LicensePlate::normalize($this->input('license_plate')),
            'is_external' => $this->boolean('is_external'),
            'is_internal' => $this->boolean('is_internal'),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'weight_type' => ['required', Rule::enum(TruckWeightType::class)],
            'vehicle_type' => ['required', Rule::enum(TruckVehicleType::class)],
            'license_plate' => ['required', 'string', 'max:50'],
            'normalized_license_plate' => [
                Rule::unique('trucks')->where('company_id', $this->user()->current_company_id),
            ],
            'is_external' => ['boolean'],
            'is_internal' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->boolean('is_external') && ! $this->boolean('is_internal')) {
                $validator->errors()->add('is_external', 'Select Internal, External, or both.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'normalized_license_plate.unique' => 'This license plate already exists in this company.',
        ];
    }
}
