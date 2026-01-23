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
        Schema::create('evidence_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('intervention_id');

            $table->enum('study_type', [
                'rct',
                'meta_analysis',
                'systematic_review',
                'observational',
                'case_series',
                'expert_opinion'
            ]);

            $table->string('population')->nullable();
            $table->enum('quality_rating', ['A', 'B', 'C', 'D'])->nullable();
            $table->text('summary');
            $table->text('notes')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

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
        Schema::dropIfExists('evidence_entries');
    }
};
