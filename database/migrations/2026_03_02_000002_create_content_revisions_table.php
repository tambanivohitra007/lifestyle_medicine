<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_revisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('revisionable_type');
            $table->uuid('revisionable_id');
            $table->unsignedInteger('version_number');
            $table->json('data');
            $table->text('change_summary')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->index(['revisionable_type', 'revisionable_id'], 'content_revisions_revisionable_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_revisions');
    }
};
