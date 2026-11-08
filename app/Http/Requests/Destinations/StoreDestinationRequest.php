<?php

namespace App\Http\Requests\Destinations;

use App\Models\Destination;
use App\Rules\ValidGoogleMapsUrl;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDestinationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Destination::class);
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
                Rule::unique('destinations')->where('company_id', $this->user()->current_company_id),
            ],
            'google_maps_url' => ['required', 'string', 'max:2048', new ValidGoogleMapsUrl],
        ];
    }
}
