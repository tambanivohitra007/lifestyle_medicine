<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Phase 3: Enhanced Evidence System
     * - Add recommendation strength to evidence entries
     * - Create evidence summaries for condition-intervention pairs
     */
    public function up(): void
    {
        // Add recommendation strength to evidence entries
        Schema::table('evidence_entries', function (Blueprint $table) {
            $table->enum('recommendation_strength', ['strong', 'weak'])
                ->nullable()
                ->after('quality_rating')
                ->comment('GRADE recommendation strength');
        });

        // Create evidence summaries table for condition-intervention pairs
        Schema::create('evidence_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('condition_id');
            $table->uuid('intervention_id');

            // Summary content
            $table->text('summary')->comment('Overall evidence summary for this pair');
            $table->text('key_findings')->nullable()->comment('Bullet points of key findings');

            // GRADE assessment
            $table->enum('overall_quality', ['A', 'B', 'C', 'D'])
                ->comment('Overall GRADE quality rating');
            $table->enum('recommendation_strength', ['strong', 'weak'])
                ->comment('GRADE recommendation strength');

            // Review metadata
            $table->date('last_reviewed')->nullable();
            $table->date('next_review_due')->nullable();
            $table->text('reviewer_notes')->nullable();

            // Statistics
            $table->unsignedInteger('total_studies')->default(0);
            $table->unsignedInteger('total_participants')->nullable();

            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('condition_id')
                ->references('id')->on('conditions')
                ->cascadeOnDelete();

            $table->foreign('intervention_id')
                ->references('id')->on('interventions')
                ->cascadeOnDelete();

            // Unique constraint - one summary per condition-intervention pair
            $table->unique(['condition_id', 'intervention_id'], 'unique_condition_intervention_summary');

            // Indexes
            $table->index('overall_quality');
            $table->index('last_reviewed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidence_summaries');

        Schema::table('evidence_entries', function (Blueprint $table) {
            $table->dropColumn('recommendation_strength');
        });
    }
};
