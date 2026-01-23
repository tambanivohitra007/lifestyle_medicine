<?php

namespace Database\Seeders;

use App\Models\CareDomain;
use Illuminate\Database\Seeder;

class CareDomainSeeder extends Seeder
{
    /**
     * Standard Lifestyle Medicine Care Domains based on the NEWSTART+ model.
     */
    public function run(): void
    {
        $domains = [
            [
                'name' => 'Nutrition',
                'description' => 'Culinary medicine, dietary interventions, plant-based nutrition, and food-based therapies',
                'icon' => 'utensils',
                'order_index' => 1,
            ],
            [
                'name' => 'Exercise',
                'description' => 'Physical activity, movement therapy, aerobic and resistance training, and fitness interventions',
                'icon' => 'activity',
                'order_index' => 2,
            ],
            [
                'name' => 'Water Therapy',
                'description' => 'Hydrotherapy, proper hydration, and water-based treatments',
                'icon' => 'droplets',
                'order_index' => 3,
            ],
            [
                'name' => 'Sunlight',
                'description' => 'Light therapy, vitamin D optimization, and circadian rhythm management',
                'icon' => 'sun',
                'order_index' => 4,
            ],
            [
                'name' => 'Temperance',
                'description' => 'Avoiding harmful substances, moderation in all things, and addiction recovery strategies',
                'icon' => 'shield',
                'order_index' => 5,
            ],
            [
                'name' => 'Air',
                'description' => 'Fresh air exposure, breathing exercises, respiratory health, and proper ventilation',
                'icon' => 'wind',
                'order_index' => 6,
            ],
            [
                'name' => 'Rest',
                'description' => 'Sleep hygiene, Sabbath rest, recovery practices, and restorative techniques',
                'icon' => 'moon',
                'order_index' => 7,
            ],
            [
                'name' => 'Trust in God',
                'description' => 'Spiritual care, faith-based healing, prayer, and religious practices',
                'icon' => 'heart',
                'order_index' => 8,
            ],
            [
                'name' => 'Mental Health',
                'description' => 'Stress management, cognitive behavioral approaches, emotional wellness, and psychological support',
                'icon' => 'brain',
                'order_index' => 9,
            ],
            [
                'name' => 'Supplements',
                'description' => 'Herbs, vitamins, minerals, and evidence-based natural supplements',
                'icon' => 'pill',
                'order_index' => 10,
            ],
            [
                'name' => 'Medications',
                'description' => 'Pharmaceutical interventions when lifestyle modifications are insufficient',
                'icon' => 'syringe',
                'order_index' => 11,
            ],
        ];

        foreach ($domains as $domain) {
            CareDomain::updateOrCreate(
                ['name' => $domain['name']],
                $domain
            );
        }
    }
}
