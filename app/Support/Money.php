<?php

namespace App\Support;

class Money
{
    /**
     * Convert a SAR decimal amount to integer halalas (1 SAR = 100 halalas),
     * rounding to avoid floating-point drift.
     */
    public static function sarToHalalas(float|string|null $sar): int
    {
        if ($sar === null || $sar === '') {
            return 0;
        }

        return (int) round(((float) $sar) * 100);
    }

    public static function halalasToSar(int $halalas): string
    {
        return number_format($halalas / 100, 2, '.', '');
    }
}
