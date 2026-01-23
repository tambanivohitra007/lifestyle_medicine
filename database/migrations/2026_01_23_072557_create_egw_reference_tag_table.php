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
        Schema::create('egw_reference_tag', function (Blueprint $table) {
            $table->uuid('egw_reference_id');
            $table->foreignId('content_tag_id');
            $table->timestamps();
            $table->softDeletes();

            $table->primary(['egw_reference_id', 'content_tag_id'], 'egw_reference_tag_primary');

            $table->foreign('egw_reference_id')
                ->references('id')
                ->on('egw_references')
                ->onDelete('cascade');

            $table->foreign('content_tag_id')
                ->references('id')
                ->on('content_tags')
                ->onDelete('cascade');

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
        Schema::dropIfExists('egw_reference_tag');
    }
};
