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
        Schema::create('transport_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('order_number');
            $table->date('order_date');
            $table->date('required_delivery_date');
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->json('customer_snapshot');
            $table->foreignId('contract_id')->constrained()->restrictOnDelete();
            $table->json('contract_snapshot');
            $table->foreignId('contract_route_id')->constrained('contract_routes')->restrictOnDelete();
            $table->json('route_snapshot');
            $table->string('customer_po_number')->nullable();
            $table->unsignedBigInteger('applied_price_halalas');
            $table->boolean('price_overridden')->default(false);
            $table->string('override_reason')->nullable();
            $table->string('override_authorized_by')->nullable();
            $table->timestamp('override_authorized_at')->nullable();
            $table->unsignedInteger('trip_count');
            $table->unsignedBigInteger('total_amount_halalas');
            $table->json('additional_charges');
            $table->string('currency')->default('SAR');
            $table->string('status');
            $table->json('cargo_details')->nullable();
            $table->text('loading_instructions')->nullable();
            $table->text('delivery_instructions')->nullable();
            $table->text('internal_remarks')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->string('confirmed_by')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_by')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'order_number']);
            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'order_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transport_orders');
    }
};
