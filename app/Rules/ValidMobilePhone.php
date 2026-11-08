<?php

namespace App\Rules;

use App\Support\DriverHelpers;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A mobile phone number is optional; when provided it must contain only
 * digits/+/spaces/hyphens/parens/dots and 7-15 digits overall (E.164-ish).
 */
class ValidMobilePhone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value !== null && ! DriverHelpers::isValidMobilePhone((string) $value)) {
            $fail('The :attribute must be a valid phone number (7 to 15 digits).');
        }
    }
}
