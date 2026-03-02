<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'conditions',
        'interventions',
        'recipes',
        'scriptures',
        'egw_references',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->string('status', 20)->default('draft')->after('id');
                $blueprint->index('status');
            });

            // Set all existing records to published so nothing breaks
            DB::table($table)->update(['status' => 'published']);
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropIndex(['status']);
                $blueprint->dropColumn('status');
            });
        }
    }
};
