<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Enhance evidence entries with sample size and additional study types.
     * Part of the Knowledge Platform Enrichment - Phase 1.
     */
    public function up(): void
    {
        Schema::table('evidence_entries', function (Blueprint $table) {
            // Add sample size for study metadata
            $table->unsignedInteger('sample_size')->nullable()->after('population');
        });

        // Expand study_type enum to include more options
        // Note: MySQL requires recreating the column for enum changes
        DB::statement("ALTER TABLE evidence_entries MODIFY COLUMN study_type ENUM(
            'meta_analysis',
            'systematic_review',
            'rct',
            'cohort',
            'case_control',
            'cross_sectional',
            'case_series',
            'case_report',
            'observational',
            'expert_opinion'
        ) NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('evidence_entries', function (Blueprint $table) {
            $table->dropColumn('sample_size');
        });

        // Revert study_type enum to original
        DB::statement("ALTER TABLE evidence_entries MODIFY COLUMN study_type ENUM(
            'rct',
            'meta_analysis',
            'systematic_review',
            'observational',
            'case_series',
            'expert_opinion'
        ) NULL");
    }
};
