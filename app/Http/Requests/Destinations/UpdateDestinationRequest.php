<?php

namespace App\Http\Requests\Destinations;

use App\Rules\ValidGoogleMapsUrl;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDestinationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('destination'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('destinations')
                    ->where('company_id', $this->user()->current_company_id)
                    ->ignore($this->route('destination')),
            ],
            'google_maps_url' => ['required', 'string', 'max:2048', new ValidGoogleMapsUrl],
        ];
    }
}
