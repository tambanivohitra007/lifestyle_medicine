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
        Schema::create('evidence_reference', function (Blueprint $table) {
            $table->id();
            $table->uuid('evidence_entry_id');
            $table->uuid('reference_id');

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('evidence_entry_id')->references('id')->on('evidence_entries')->cascadeOnDelete();
            $table->foreign('reference_id')->references('id')->on('references')->cascadeOnDelete();

            $table->unique(['evidence_entry_id', 'reference_id'], 'evidence_reference_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidence_reference');
    }
};
