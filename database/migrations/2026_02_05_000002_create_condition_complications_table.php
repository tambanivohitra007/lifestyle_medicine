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
        Schema::create('condition_complications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('source_condition_id');
            $table->uuid('complication_condition_id')->nullable(); // Link to existing condition if applicable

            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('likelihood', ['common', 'occasional', 'rare'])->default('occasional');
            $table->string('timeframe')->nullable(); // e.g., "5-10 years", "immediate"
            $table->boolean('preventable')->default(true);
            $table->integer('order_index')->default(0);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('source_condition_id')
                  ->references('id')->on('conditions')
                  ->cascadeOnDelete();

            $table->foreign('complication_condition_id')
                  ->references('id')->on('conditions')
                  ->nullOnDelete();

            $table->index('source_condition_id');
            $table->index('complication_condition_id');
            $table->index('likelihood');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('condition_complications');
    }
};
