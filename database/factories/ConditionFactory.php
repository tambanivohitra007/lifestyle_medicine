<?php

namespace Database\Factories;

use App\Models\Condition;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConditionFactory extends Factory
{
    protected $model = Condition::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'category' => fake()->randomElement(['cardiovascular', 'metabolic', 'neurological', 'musculoskeletal']),
            'summary' => fake()->paragraph(),
            'status' => 'published',
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => 'draft']);
    }

    public function inReview(): static
    {
        return $this->state(fn () => ['status' => 'in_review']);
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => 'published']);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => 'archived']);
    }
}
