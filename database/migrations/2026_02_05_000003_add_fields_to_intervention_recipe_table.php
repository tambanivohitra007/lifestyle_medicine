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
        Schema::table('intervention_recipe', function (Blueprint $table) {
            $table->text('relevance_note')->nullable()->after('recipe_id');
            $table->integer('order_index')->default(0)->after('relevance_note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intervention_recipe', function (Blueprint $table) {
            $table->dropColumn(['relevance_note', 'order_index']);
        });
    }
};
