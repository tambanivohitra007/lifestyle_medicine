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
        Schema::create('condition_scripture', function (Blueprint $table) {
            $table->id();
            $table->uuid('condition_id');
            $table->uuid('scripture_id');

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('condition_id')->references('id')->on('conditions')->cascadeOnDelete();
            $table->foreign('scripture_id')->references('id')->on('scriptures')->cascadeOnDelete();
            $table->unique(['condition_id', 'scripture_id'], 'condition_scripture_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('condition_scripture');
    }
};
