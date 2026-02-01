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
        Schema::create('infographic_generation_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('condition_id');
            $table->string('infographic_type'); // overview, risk_factors, lifestyle_solutions
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->text('prompt');
            $table->json('generation_params')->nullable();
            $table->uuid('media_id')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('condition_id')
                ->references('id')
                ->on('conditions')
                ->onDelete('cascade');

            $table->foreign('media_id')
                ->references('id')
                ->on('media')
                ->onDelete('set null');

            $table->index(['condition_id', 'infographic_type'], 'infographic_req_cond_type_idx');
            $table->index('status', 'infographic_req_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('infographic_generation_requests');
    }
};
