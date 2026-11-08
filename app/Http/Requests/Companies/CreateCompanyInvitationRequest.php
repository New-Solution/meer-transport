<?php

namespace App\Http\Requests\Companies;

use App\Enums\CompanyRole;
use App\Models\Company;
use App\Rules\UniqueCompanyInvitation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCompanyInvitationRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $company = $this->route('company');

        abort_if(! $company instanceof Company, 404);

        return [
            'email' => ['required', 'string', 'email', 'max:255', new UniqueCompanyInvitation($company)],
            'role' => ['required', 'string', Rule::enum(CompanyRole::class)],
        ];
    }
}
