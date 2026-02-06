<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Phase 4: Knowledge Graph Enrichment
     * - Body systems hierarchy
     * - Intervention effectiveness ratings
     * - Intervention relationships (synergy/conflict)
     */
    public function up(): void
    {
        // Create body systems table (top-level medical ontology)
        Schema::create('body_systems', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->string('snomed_code', 20)->nullable();
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable()->comment('Icon identifier for UI');
            $table->string('color', 20)->nullable()->comment('Color for visualization');
            $table->unsignedInteger('display_order')->default(0);

            $table->timestamps();

            $table->index('display_order');
        });

        // Create condition categories table (subcategories under body systems)
        Schema::create('condition_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('body_system_id');
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->text('description')->nullable();
            $table->unsignedInteger('display_order')->default(0);

            $table->timestamps();

            $table->foreign('body_system_id')
                ->references('id')->on('body_systems')
                ->cascadeOnDelete();

            $table->unique(['body_system_id', 'slug']);
            $table->index('display_order');
        });

        // Add body_system_id to conditions table
        Schema::table('conditions', function (Blueprint $table) {
            $table->uuid('body_system_id')->nullable()->after('category');

            $table->foreign('body_system_id')
                ->references('id')->on('body_systems')
                ->nullOnDelete();

            $table->index('body_system_id');
        });

        // Create intervention effectiveness table
        Schema::create('intervention_effectiveness', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('intervention_id');
            $table->uuid('condition_id');

            $table->enum('effectiveness_rating', [
                'very_high',
                'high',
                'moderate',
                'low',
                'uncertain'
            ])->default('moderate');

            $table->enum('evidence_grade', ['A', 'B', 'C', 'D'])->nullable();
            $table->boolean('is_primary')->default(false)->comment('Is this a primary/first-line intervention?');
            $table->text('notes')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->foreign('intervention_id')
                ->references('id')->on('interventions')
                ->cascadeOnDelete();

            $table->foreign('condition_id')
                ->references('id')->on('conditions')
                ->cascadeOnDelete();

            // One rating per intervention-condition pair
            $table->unique(['intervention_id', 'condition_id'], 'unique_intervention_condition');

            $table->index('effectiveness_rating');
            $table->index('is_primary');
        });

        // Create intervention relationships table
        Schema::create('intervention_relationships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('intervention_a_id');
            $table->uuid('intervention_b_id');

            $table->enum('relationship_type', [
                'synergy',       // Work better together
                'complementary', // Support each other
                'neutral',       // No significant interaction
                'caution',       // Use together with care
                'conflict'       // Should not be used together
            ])->default('neutral');

            $table->text('description')->nullable();
            $table->text('clinical_notes')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->foreign('intervention_a_id')
                ->references('id')->on('interventions')
                ->cascadeOnDelete();

            $table->foreign('intervention_b_id')
                ->references('id')->on('interventions')
                ->cascadeOnDelete();

            // Prevent duplicate relationships (A-B is same as B-A)
            $table->unique(['intervention_a_id', 'intervention_b_id'], 'unique_intervention_pair');

            $table->index('relationship_type');
        });

        // Seed common body systems
        $this->seedBodySystems();
    }

    /**
     * Seed common body systems for lifestyle medicine.
     */
    private function seedBodySystems(): void
    {
        $systems = [
            [
                'name' => 'Cardiovascular',
                'slug' => 'cardiovascular',
                'snomed_code' => '113257007',
                'description' => 'Heart and blood vessel conditions',
                'icon' => 'heart',
                'color' => '#EF4444',
                'display_order' => 1,
            ],
            [
                'name' => 'Metabolic & Endocrine',
                'slug' => 'metabolic-endocrine',
                'snomed_code' => '113331007',
                'description' => 'Metabolism, hormones, and energy regulation',
                'icon' => 'activity',
                'color' => '#F59E0B',
                'display_order' => 2,
            ],
            [
                'name' => 'Gastrointestinal',
                'slug' => 'gastrointestinal',
                'snomed_code' => '122865005',
                'description' => 'Digestive system conditions',
                'icon' => 'utensils',
                'color' => '#10B981',
                'display_order' => 3,
            ],
            [
                'name' => 'Musculoskeletal',
                'slug' => 'musculoskeletal',
                'snomed_code' => '113192009',
                'description' => 'Bones, joints, and muscles',
                'icon' => 'bone',
                'color' => '#6366F1',
                'display_order' => 4,
            ],
            [
                'name' => 'Neurological',
                'slug' => 'neurological',
                'snomed_code' => '25087005',
                'description' => 'Brain and nervous system',
                'icon' => 'brain',
                'color' => '#8B5CF6',
                'display_order' => 5,
            ],
            [
                'name' => 'Mental Health',
                'slug' => 'mental-health',
                'snomed_code' => '74732009',
                'description' => 'Psychological and emotional wellbeing',
                'icon' => 'smile',
                'color' => '#EC4899',
                'display_order' => 6,
            ],
            [
                'name' => 'Respiratory',
                'slug' => 'respiratory',
                'snomed_code' => '20139000',
                'description' => 'Lungs and breathing',
                'icon' => 'wind',
                'color' => '#06B6D4',
                'display_order' => 7,
            ],
            [
                'name' => 'Immune & Inflammatory',
                'slug' => 'immune-inflammatory',
                'snomed_code' => '116003000',
                'description' => 'Immune system and inflammation',
                'icon' => 'shield',
                'color' => '#14B8A6',
                'display_order' => 8,
            ],
            [
                'name' => 'Sleep & Circadian',
                'slug' => 'sleep-circadian',
                'snomed_code' => '258158006',
                'description' => 'Sleep disorders and circadian rhythm',
                'icon' => 'moon',
                'color' => '#6366F1',
                'display_order' => 9,
            ],
        ];

        $now = now();
        foreach ($systems as &$system) {
            $system['id'] = \Illuminate\Support\Str::uuid()->toString();
            $system['created_at'] = $now;
            $system['updated_at'] = $now;
        }

        DB::table('body_systems')->insert($systems);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intervention_relationships');
        Schema::dropIfExists('intervention_effectiveness');

        Schema::table('conditions', function (Blueprint $table) {
            $table->dropForeign(['body_system_id']);
            $table->dropColumn('body_system_id');
        });

        Schema::dropIfExists('condition_categories');
        Schema::dropIfExists('body_systems');
    }
};
