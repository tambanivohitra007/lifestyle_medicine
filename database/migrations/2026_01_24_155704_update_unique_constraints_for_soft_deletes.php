<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Remove simple unique constraints that conflict with soft deletes.
     * Uniqueness is now enforced at the application level with whereNull('deleted_at').
     */
    public function up(): void
    {
        // Remove unique constraint from conditions.name
        Schema::table('conditions', function (Blueprint $table) {
            $table->dropUnique('conditions_name_unique');
        });

        // Remove unique constraint from care_domains.name
        Schema::table('care_domains', function (Blueprint $table) {
            $table->dropUnique('care_domains_name_unique');
        });

        // Remove unique constraint from content_tags.tag
        Schema::table('content_tags', function (Blueprint $table) {
            $table->dropUnique('content_tags_tag_unique');
        });

        // Remove unique constraint from users.email
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore unique constraint on conditions.name
        Schema::table('conditions', function (Blueprint $table) {
            $table->unique('name');
        });

        // Restore unique constraint on care_domains.name
        Schema::table('care_domains', function (Blueprint $table) {
            $table->unique('name');
        });

        // Restore unique constraint on content_tags.tag
        Schema::table('content_tags', function (Blueprint $table) {
            $table->unique('tag');
        });

        // Restore unique constraint on users.email
        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};
