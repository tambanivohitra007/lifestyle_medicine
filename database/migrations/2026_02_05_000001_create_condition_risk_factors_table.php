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
        Schema::create('condition_risk_factors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('condition_id');

            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('risk_type', ['modifiable', 'non_modifiable', 'environmental', 'behavioral'])->default('modifiable');
            $table->enum('severity', ['high', 'moderate', 'low'])->default('moderate');
            $table->integer('order_index')->default(0);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('condition_id')
                  ->references('id')->on('conditions')
                  ->cascadeOnDelete();

            $table->index('condition_id');
            $table->index('risk_type');
            $table->index('severity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('condition_risk_factors');
    }
};
