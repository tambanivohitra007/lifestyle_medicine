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
        // EGW References table
        Schema::create('egw_references', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('book'); // e.g., "Ministry of Healing", "Counsels on Diet and Foods"
            $table->string('book_abbreviation')->nullable(); // e.g., "MH", "CD"
            $table->string('chapter')->nullable(); // Chapter name or number
            $table->integer('page_start')->nullable(); // Starting page
            $table->integer('page_end')->nullable(); // Ending page (for ranges)
            $table->string('paragraph')->nullable(); // Paragraph number if applicable
            $table->text('quote'); // The actual quotation
            $table->string('topic')->nullable(); // Topic/theme (e.g., "Diet", "Exercise", "Rest")
            $table->text('context')->nullable(); // Additional context or notes
            $table->timestamps();
            $table->softDeletes();

            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            // Indexes
            $table->index('book');
            $table->index('topic');
        });

        // Pivot table for conditions
        Schema::create('condition_egw_reference', function (Blueprint $table) {
            $table->uuid('condition_id');
            $table->uuid('egw_reference_id');
            $table->timestamps();

            $table->foreign('condition_id')->references('id')->on('conditions')->onDelete('cascade');
            $table->foreign('egw_reference_id')->references('id')->on('egw_references')->onDelete('cascade');

            $table->primary(['condition_id', 'egw_reference_id']);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
        });

        // Pivot table for interventions
        Schema::create('intervention_egw_reference', function (Blueprint $table) {
            $table->uuid('intervention_id');
            $table->uuid('egw_reference_id');
            $table->timestamps();

            $table->foreign('intervention_id')->references('id')->on('interventions')->onDelete('cascade');
            $table->foreign('egw_reference_id')->references('id')->on('egw_references')->onDelete('cascade');

            $table->primary(['intervention_id', 'egw_reference_id']);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intervention_egw_reference');
        Schema::dropIfExists('condition_egw_reference');
        Schema::dropIfExists('egw_references');
    }
};
