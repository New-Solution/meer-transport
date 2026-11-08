<?php

namespace App\Support;

class LicensePlate
{
    /**
     * Normalize a license plate for deterministic storage, indexing, and
     * uniqueness matching:
     * - Converts Arabic-Indic and Eastern Arabic-Indic digits to ASCII.
     * - Removes Arabic diacritics (tashkeel) and tatweel (kashida).
     * - Normalizes Arabic Alef variants, Ta Marbuta, and Alif Maqsura.
     * - Converts Latin letters to uppercase.
     * - Collapses whitespace.
     */
    public static function normalize(?string $plate): string
    {
        if (! $plate) {
            return '';
        }

        $arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $easternDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $asciiDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        $normalized = str_replace($arabicDigits, $asciiDigits, $plate);
        $normalized = str_replace($easternDigits, $asciiDigits, $normalized);

        // Remove Arabic diacritics (tashkeel) and tatweel (kashida).
        $normalized = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $normalized);

        // Normalize Alef variants to bare Alef.
        $normalized = preg_replace('/[أإآٱ]/u', 'ا', $normalized);

        // Normalize Ta Marbuta to Ha, Alif Maqsura to Ya.
        $normalized = str_replace(['ة', 'ى'], ['ه', 'ي'], $normalized);

        $normalized = mb_strtoupper(trim($normalized));

        return preg_replace('/\s+/', ' ', $normalized);
    }

    /**
     * Clean a user-entered plate for display: trims and collapses whitespace
     * while preserving the originally entered characters.
     */
    public static function clean(?string $plate): string
    {
        if (! $plate) {
            return '';
        }

        return preg_replace('/\s+/', ' ', trim($plate));
    }
}
