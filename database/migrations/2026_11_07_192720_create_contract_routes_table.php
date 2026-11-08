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
        Schema::create('contract_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('from_city');
            $table->string('to_city');
            $table->foreignId('destination_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('vehicle_type')->default('Truck');
            $table->unsignedBigInteger('price_halalas');
            $table->unsignedInteger('sort_order')->default(1);
            $table->unsignedBigInteger('return_price_halalas')->default(0);
            $table->unsignedBigInteger('stay_price_halalas')->default(0);
            $table->unsignedBigInteger('stop_price_halalas')->default(0);
            $table->unsignedBigInteger('additional_price_halalas')->default(0);
            $table->timestamps();

            $table->index(['contract_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_routes');
    }
};
