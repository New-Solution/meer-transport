<?php

namespace App\Support;

class DriverHelpers
{
    /**
     * Normalize Eastern Arabic-Indic and Arabic-Indic numerals to ASCII digits.
     */
    public static function normalizeIndicDigits(?string $value): string
    {
        if (! $value) {
            return '';
        }

        $arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $easternArabicIndic = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $ascii = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        $value = str_replace($arabicIndic, $ascii, $value);

        return str_replace($easternArabicIndic, $ascii, $value);
    }

    /**
     * A mobile phone is optional; when provided it must contain only
     * digits/+/spaces/hyphens/parens/dots and 7-15 digits overall (E.164-ish).
     */
    public static function isValidMobilePhone(?string $phone): bool
    {
        if (! $phone || trim($phone) === '') {
            return true;
        }

        $normalized = self::normalizeIndicDigits(trim($phone));

        if (preg_match('/^\+?[0-9\s\-().]+$/', $normalized) !== 1) {
            return false;
        }

        $digitsOnly = preg_replace('/\D/', '', $normalized);

        return strlen($digitsOnly) >= 7 && strlen($digitsOnly) <= 15;
    }

    public static function cleanPhoneNumber(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        $trimmed = self::normalizeIndicDigits(trim($phone));

        return $trimmed !== '' ? $trimmed : null;
    }

    public static function normalizeSaudiIdIqama(?string $id): ?string
    {
        if (! $id) {
            return null;
        }

        $normalized = self::normalizeIndicDigits(trim($id));

        return $normalized !== '' ? $normalized : null;
    }
}
