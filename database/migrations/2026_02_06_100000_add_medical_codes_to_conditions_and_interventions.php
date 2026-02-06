<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add medical coding fields (SNOMED CT, ICD-10) for standardization.
     * Part of the Knowledge Platform Enrichment - Phase 1.
     */
    public function up(): void
    {
        // Add medical codes to conditions table
        Schema::table('conditions', function (Blueprint $table) {
            $table->string('snomed_code', 20)->nullable()->after('summary');
            $table->string('icd10_code', 20)->nullable()->after('snomed_code');

            // Indexes for efficient lookups
            $table->index('snomed_code');
            $table->index('icd10_code');
        });

        // Add medical codes to interventions table
        Schema::table('interventions', function (Blueprint $table) {
            $table->string('snomed_code', 20)->nullable()->after('mechanism');

            // Index for efficient lookups
            $table->index('snomed_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conditions', function (Blueprint $table) {
            $table->dropIndex(['snomed_code']);
            $table->dropIndex(['icd10_code']);
            $table->dropColumn(['snomed_code', 'icd10_code']);
        });

        Schema::table('interventions', function (Blueprint $table) {
            $table->dropIndex(['snomed_code']);
            $table->dropColumn('snomed_code');
        });
    }
};
