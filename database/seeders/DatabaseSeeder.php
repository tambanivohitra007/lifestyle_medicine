<?php

namespace Database\Seeders;

use App\Models\CareDomain;
use App\Models\Condition;
use App\Models\ConditionSection;
use App\Models\ContentTag;
use App\Models\EvidenceEntry;
use App\Models\Intervention;
use App\Models\Recipe;
use App\Models\Reference;
use App\Models\Scripture;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        // Create test user
        User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
        ]);

        // Create Care Domains
        $nutrition = CareDomain::create(['name' => 'Nutrition']);
        $exercise = CareDomain::create(['name' => 'Exercise']);
        $hydrotherapy = CareDomain::create(['name' => 'Hydrotherapy']);
        $spiritualCare = CareDomain::create(['name' => 'Spiritual Care']);
        $stressManagement = CareDomain::create(['name' => 'Stress Management']);

        // Create Content Tags
        $plantBased = ContentTag::create(['tag' => 'plant-based']);
        $antiInflammatory = ContentTag::create(['tag' => 'anti-inflammatory']);
        $cardiovascular = ContentTag::create(['tag' => 'cardiovascular']);
        $faith = ContentTag::create(['tag' => 'faith']);
        $healing = ContentTag::create(['tag' => 'healing']);

        // Create Conditions
        $diabetes = Condition::create([
            'name' => 'Type 2 Diabetes',
            'category' => 'Metabolic',
            'summary' => 'Chronic condition affecting blood sugar regulation'
        ]);

        $hypertension = Condition::create([
            'name' => 'Hypertension',
            'category' => 'Cardiovascular',
            'summary' => 'Elevated blood pressure requiring lifestyle management'
        ]);

        // Create Condition Sections for Diabetes
        ConditionSection::create([
            'condition_id' => $diabetes->id,
            'section_type' => 'risk_factors',
            'title' => 'Key Risk Factors',
            'body' => 'Obesity, sedentary lifestyle, family history, and poor dietary patterns increase risk.',
            'order_index' => 0,
        ]);

        ConditionSection::create([
            'condition_id' => $diabetes->id,
            'section_type' => 'physiology',
            'title' => 'Pathophysiology',
            'body' => 'Insulin resistance develops when cells fail to respond effectively to insulin, leading to elevated blood glucose levels.',
            'order_index' => 1,
        ]);

        ConditionSection::create([
            'condition_id' => $diabetes->id,
            'section_type' => 'solutions',
            'title' => 'Lifestyle Solutions',
            'body' => 'Plant-based nutrition, regular physical activity, stress management, and spiritual support form the foundation of diabetes reversal.',
            'order_index' => 2,
        ]);

        // Create Interventions
        $plantBasedDiet = Intervention::create([
            'care_domain_id' => $nutrition->id,
            'name' => 'Whole Food Plant-Based Diet',
            'description' => 'Diet centered on unprocessed plant foods including vegetables, fruits, whole grains, legumes, nuts, and seeds',
            'mechanism' => 'Reduces inflammation, improves insulin sensitivity, and promotes healthy gut microbiome',
        ]);

        $aerobicExercise = Intervention::create([
            'care_domain_id' => $exercise->id,
            'name' => 'Aerobic Exercise',
            'description' => '150 minutes per week of moderate-intensity aerobic activity',
            'mechanism' => 'Enhances insulin sensitivity, reduces visceral fat, and improves cardiovascular function',
        ]);

        $prayerMeditation = Intervention::create([
            'care_domain_id' => $spiritualCare->id,
            'name' => 'Prayer and Meditation',
            'description' => 'Daily practice of prayer, scripture meditation, and mindfulness',
            'mechanism' => 'Reduces stress hormones, promotes peace, and supports emotional well-being',
        ]);

        // Attach Interventions to Diabetes
        $diabetes->interventions()->attach($plantBasedDiet->id, [
            'strength_of_evidence' => 'high',
            'recommendation_level' => 'core',
            'clinical_notes' => 'Multiple RCTs demonstrate reversal of insulin resistance',
            'order_index' => 0,
        ]);

        $diabetes->interventions()->attach($aerobicExercise->id, [
            'strength_of_evidence' => 'high',
            'recommendation_level' => 'core',
            'clinical_notes' => 'Improves glycemic control and reduces HbA1c',
            'order_index' => 1,
        ]);

        $diabetes->interventions()->attach($prayerMeditation->id, [
            'strength_of_evidence' => 'moderate',
            'recommendation_level' => 'adjunct',
            'clinical_notes' => 'Reduces stress-related blood sugar elevations',
            'order_index' => 2,
        ]);

        // Create References
        $ref1 = Reference::create([
            'citation' => 'Barnard ND, et al. A low-fat vegan diet improves glycemic control and cardiovascular risk factors in a randomized clinical trial in individuals with type 2 diabetes. Diabetes Care. 2006;29(8):1777-83.',
            'doi' => '10.2337/dc06-0606',
            'pmid' => '16873779',
            'url' => 'https://pubmed.ncbi.nlm.nih.gov/16873779/',
            'year' => 2006,
        ]);

        $ref2 = Reference::create([
            'citation' => 'Colberg SR, et al. Physical Activity/Exercise and Diabetes: A Position Statement of the American Diabetes Association. Diabetes Care. 2016;39(11):2065-2079.',
            'doi' => '10.2337/dc16-1728',
            'pmid' => '27926890',
            'year' => 2016,
        ]);

        // Create Evidence Entries
        $evidence1 = EvidenceEntry::create([
            'intervention_id' => $plantBasedDiet->id,
            'study_type' => 'rct',
            'population' => 'Adults with Type 2 Diabetes',
            'quality_rating' => 'A',
            'summary' => 'Plant-based diet led to significant improvements in HbA1c, body weight, and lipid profiles compared to conventional diabetes diet',
            'notes' => '22-week randomized controlled trial with 99 participants',
        ]);

        $evidence1->references()->attach([$ref1->id, $ref2->id]);

        // Create Scriptures
        $scripture1 = Scripture::create([
            'reference' => '3 John 1:2',
            'text' => 'Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth.',
            'theme' => 'Health and Wholeness',
        ]);

        $scripture2 = Scripture::create([
            'reference' => 'Proverbs 17:22',
            'text' => 'A merry heart doeth good like a medicine: but a broken spirit drieth the bones.',
            'theme' => 'Mental and Emotional Health',
        ]);

        // Attach Scriptures to Condition
        $diabetes->scriptures()->attach([$scripture1->id, $scripture2->id]);

        // Attach Tags to Scriptures
        $scripture1->tags()->attach([$faith->id, $healing->id]);

        // Create Recipes
        $recipe1 = Recipe::create([
            'title' => 'Diabetes-Friendly Buddha Bowl',
            'description' => 'Nutrient-dense bowl with quinoa, roasted vegetables, and tahini dressing',
            'dietary_tags' => ['vegan', 'gluten-free', 'low-glycemic'],
            'ingredients' => [
                '1 cup cooked quinoa',
                '1 cup roasted sweet potato cubes',
                '1 cup steamed broccoli',
                '1/2 cup chickpeas',
                '2 tbsp tahini dressing',
                'Fresh lemon juice',
            ],
            'instructions' => 'Layer quinoa in bowl. Add roasted vegetables and chickpeas. Drizzle with tahini dressing and lemon juice. Serve immediately.',
            'servings' => 2,
            'prep_time_minutes' => 15,
            'cook_time_minutes' => 30,
        ]);

        // Attach Recipe to Condition and Intervention
        $diabetes->recipes()->attach($recipe1->id);
        $plantBasedDiet->recipes()->attach($recipe1->id);

        // Attach Tags to Recipe
        $recipe1->tags()->attach([$plantBased->id, $antiInflammatory->id]);

        // Tag Interventions
        $plantBasedDiet->tags()->attach([$plantBased->id, $cardiovascular->id]);
        $aerobicExercise->tags()->attach([$cardiovascular->id]);

        $this->command->info('Database seeded successfully with lifestyle medicine content!');
    }
}
