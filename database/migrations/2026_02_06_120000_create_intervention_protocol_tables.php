<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create structured intervention protocol tables.
     * Part of the Knowledge Platform Enrichment - Phase 2.
     */
    public function up(): void
    {
        // Main protocol table - one protocol per intervention
        Schema::create('intervention_protocols', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('intervention_id');
            $table->string('version', 20)->default('1.0');
            $table->unsignedInteger('duration_weeks')->nullable();
            $table->unsignedInteger('frequency_per_week')->nullable();
            $table->enum('intensity_level', ['low', 'moderate', 'high', 'variable'])->nullable();
            $table->text('overview')->nullable();
            $table->text('prerequisites')->nullable();
            $table->text('equipment_needed')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->foreign('intervention_id')
                  ->references('id')->on('interventions')
                  ->cascadeOnDelete();

            // One protocol per intervention
            $table->unique('intervention_id');
        });

        // Protocol phases/steps
        Schema::create('protocol_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('protocol_id');
            $table->unsignedInteger('step_number');
            $table->string('phase_name')->nullable(); // e.g., "Foundation", "Transition", "Maintenance"
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->unsignedInteger('week_start')->default(1);
            $table->unsignedInteger('week_end')->nullable();
            $table->string('frequency')->nullable(); // e.g., "3x per week", "daily"
            $table->text('instructions')->nullable();
            $table->text('tips')->nullable();

            $table->timestamps();

            $table->foreign('protocol_id')
                  ->references('id')->on('intervention_protocols')
                  ->cascadeOnDelete();

            $table->index(['protocol_id', 'step_number']);
        });

        // Contraindications - when NOT to use an intervention
        Schema::create('intervention_contraindications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('intervention_id');
            $table->uuid('condition_id')->nullable(); // Optional link to a condition
            $table->string('title');
            $table->text('description');
            $table->enum('severity', ['absolute', 'relative', 'caution'])->default('caution');
            $table->text('alternative_recommendation')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->foreign('intervention_id')
                  ->references('id')->on('interventions')
                  ->cascadeOnDelete();

            $table->foreign('condition_id')
                  ->references('id')->on('conditions')
                  ->nullOnDelete();

            $table->index('intervention_id');
        });

        // Expected outcomes - what results to expect
        Schema::create('intervention_outcomes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('intervention_id');
            $table->string('outcome_measure'); // e.g., "LDL Cholesterol", "HbA1c", "Weight"
            $table->string('expected_change')->nullable(); // e.g., "-20 to -30%", "-0.5 to -1.0%"
            $table->string('direction')->nullable(); // e.g., "decrease", "increase", "improve"
            $table->unsignedInteger('timeline_weeks')->nullable();
            $table->enum('evidence_grade', ['A', 'B', 'C', 'D'])->nullable();
            $table->string('measurement_method')->nullable(); // e.g., "Blood test", "Scale"
            $table->text('notes')->nullable();
            $table->unsignedInteger('order_index')->default(0);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->foreign('intervention_id')
                  ->references('id')->on('interventions')
                  ->cascadeOnDelete();

            $table->index('intervention_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intervention_outcomes');
        Schema::dropIfExists('intervention_contraindications');
        Schema::dropIfExists('protocol_steps');
        Schema::dropIfExists('intervention_protocols');
    }
};
