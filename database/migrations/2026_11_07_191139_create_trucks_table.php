<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('weight_type');
            $table->string('vehicle_type');
            $table->string('license_plate');
            $table->string('normalized_license_plate');
            $table->boolean('is_external')->default(false);
            $table->boolean('is_internal')->default(false);
            $table->timestamps();

            $table->unique(['company_id', 'normalized_license_plate']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
