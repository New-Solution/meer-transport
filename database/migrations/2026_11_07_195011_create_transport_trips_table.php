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
        Schema::create('transport_trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('transport_orders')->cascadeOnDelete();
            $table->string('trip_number');
            $table->unsignedInteger('sequence_number');
            $table->string('status');
            $table->string('from_city');
            $table->string('to_city');
            $table->string('vehicle_type');
            $table->unsignedBigInteger('applied_price_halalas');
            $table->date('planned_pickup_date');
            $table->date('planned_delivery_date');
            $table->json('cargo_details')->nullable();
            $table->text('special_notes')->nullable();
            $table->foreignId('truck_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('truck_amount_halalas')->default(0);
            $table->timestamps();

            $table->index(['order_id', 'sequence_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transport_trips');
    }
};
