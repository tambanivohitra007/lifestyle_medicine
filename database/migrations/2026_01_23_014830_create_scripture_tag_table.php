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
        Schema::create('scripture_tag', function (Blueprint $table) {
            $table->id();
            $table->uuid('scripture_id');
            $table->foreignId('content_tag_id')->constrained()->cascadeOnDelete();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('scripture_id')->references('id')->on('scriptures')->cascadeOnDelete();
            $table->unique(['scripture_id', 'content_tag_id'], 'scripture_tag_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scripture_tag');
    }
};
