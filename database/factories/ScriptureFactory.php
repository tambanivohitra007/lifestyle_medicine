<?php

namespace Database\Factories;

use App\Models\Scripture;
use Illuminate\Database\Eloquent\Factories\Factory;

class ScriptureFactory extends Factory
{
    protected $model = Scripture::class;

    public function definition(): array
    {
        return [
            'reference' => fake()->unique()->numerify('Psalm ##:##'),
            'text' => fake()->paragraph(),
            'theme' => fake()->randomElement(['healing', 'faith', 'peace', 'restoration']),
            'status' => 'published',
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => 'draft']);
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => 'published']);
    }
}
