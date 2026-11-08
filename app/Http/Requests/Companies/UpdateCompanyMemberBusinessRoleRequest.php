<?php

namespace App\Http\Requests\Companies;

use App\Enums\BusinessRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyMemberBusinessRoleRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'business_role' => ['required', 'string', Rule::in(array_column(BusinessRole::options(), 'value'))],
        ];
    }
}
