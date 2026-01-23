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
        Schema::create('intervention_scripture', function (Blueprint $table) {
            $table->id();
            $table->uuid('intervention_id');
            $table->uuid('scripture_id');

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('intervention_id')->references('id')->on('interventions')->cascadeOnDelete();
            $table->foreign('scripture_id')->references('id')->on('scriptures')->cascadeOnDelete();
            $table->unique(['intervention_id', 'scripture_id'], 'intervention_scripture_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intervention_scripture');
    }
};
