<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that a value is a safe HTTPS Google Maps URL. Accepts:
 * - maps.google.com / maps.google.<tld>
 * - google.com/maps / www.google.com/maps / google.<tld>/maps
 * - maps.app.goo.gl
 * - goo.gl/maps
 *
 * Rejects non-HTTPS schemes and unrelated domains.
 */
class ValidGoogleMapsUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! $this->isValid($value)) {
            $fail('The :attribute must be a valid, safe HTTPS Google Maps URL (e.g. https://maps.app.goo.gl/... or https://google.com/maps...).');
        }
    }

    private function isValid(string $url): bool
    {
        $trimmed = trim($url);

        if (! str_starts_with($trimmed, 'https://')) {
            return false;
        }

        $parts = parse_url($trimmed);

        if ($parts === false || ($parts['scheme'] ?? null) !== 'https' || empty($parts['host'])) {
            return false;
        }

        $host = strtolower($parts['host']);
        $path = strtolower($parts['path'] ?? '');

        if ($host === 'maps.app.goo.gl') {
            return strlen($path) > 1;
        }

        if ($host === 'goo.gl' && str_starts_with($path, '/maps')) {
            return true;
        }

        if ($host === 'maps.google.com' || str_starts_with($host, 'maps.google.')) {
            return true;
        }

        $isGoogleDomain = $host === 'google.com'
            || $host === 'www.google.com'
            || str_ends_with($host, '.google.com')
            || preg_match('/^www\.google\.[a-z.]{2,}$/', $host) === 1
            || preg_match('/^google\.[a-z.]{2,}$/', $host) === 1;

        return $isGoogleDomain && (str_starts_with($path, '/maps') || $path === '/maps');
    }
}
