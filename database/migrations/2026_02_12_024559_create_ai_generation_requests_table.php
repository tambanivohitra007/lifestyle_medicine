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
        Schema::create('ai_generation_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // draft, structure, import
            $table->string('condition_name');
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->json('input_data')->nullable();
            $table->json('output_data')->nullable();
            $table->text('error_message')->nullable();
            $table->foreignUuid('requested_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index('requested_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generation_requests');
    }
};
