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
        Schema::create('condition_interventions', function (Blueprint $table) {
            $table->id();
            $table->uuid('condition_id');
            $table->uuid('intervention_id');

            $table->enum('strength_of_evidence', [
                'high', 'moderate', 'emerging', 'insufficient'
            ])->default('emerging');

            $table->enum('recommendation_level', [
                'core', 'adjunct', 'optional'
            ])->default('optional');

            $table->text('clinical_notes')->nullable();
            $table->unsignedInteger('order_index')->default(0);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('condition_id')->references('id')->on('conditions')->cascadeOnDelete();
            $table->foreign('intervention_id')->references('id')->on('interventions')->cascadeOnDelete();

            // Unique constraint on the combination (works better with soft deletes than composite PK)
            $table->unique(['condition_id', 'intervention_id'], 'condition_intervention_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('condition_interventions');
    }
};
