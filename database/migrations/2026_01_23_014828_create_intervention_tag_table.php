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
        Schema::create('intervention_tag', function (Blueprint $table) {
            $table->id();
            $table->uuid('intervention_id');
            $table->foreignId('content_tag_id')->constrained()->cascadeOnDelete();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('intervention_id')->references('id')->on('interventions')->cascadeOnDelete();
            $table->unique(['intervention_id', 'content_tag_id'], 'intervention_tag_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intervention_tag');
    }
};
