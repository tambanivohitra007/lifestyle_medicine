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
        Schema::create('condition_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('condition_id');

            $table->enum('section_type', [
                'risk_factors',
                'physiology',
                'complications',
                'solutions',
                'additional_factors',
                'scripture'
            ]);

            $table->string('title')->nullable();
            $table->longText('body');
            $table->unsignedInteger('order_index')->default(0);

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('condition_id')
                  ->references('id')->on('conditions')
                  ->cascadeOnDelete();

            // Performance index
            $table->index(['condition_id', 'section_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('condition_sections');
    }
};
