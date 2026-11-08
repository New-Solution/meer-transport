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
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('nationality')->nullable();
            $table->string('license_no')->nullable();
            $table->date('license_expiry')->nullable();
            $table->string('saudi_id_iqama_no')->nullable();
            $table->date('id_iqama_expiry')->nullable();
            $table->string('mobile_phone_1')->nullable();
            $table->string('mobile_phone_2')->nullable();
            $table->string('home_city')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'saudi_id_iqama_no']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
