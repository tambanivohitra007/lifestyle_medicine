<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class RecipeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Recipe::with('tags');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('dietary_tag')) {
            $query->whereJsonContains('dietary_tags', $request->dietary_tag);
        }

        if ($request->has('tag_id')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('content_tags.id', $request->tag_id);
            });
        }

        $recipes = $query->paginate(20);

        return RecipeResource::collection($recipes);
    }

    public function show(Recipe $recipe): RecipeResource
    {
        $recipe->load(['conditions', 'interventions', 'tags', 'creator', 'updater']);

        return new RecipeResource($recipe);
    }

    public function store(Request $request): RecipeResource
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'dietary_tags' => 'nullable|array',
            'ingredients' => 'nullable|array',
            'instructions' => 'nullable|string',
            'servings' => 'nullable|integer|min:1',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'cook_time_minutes' => 'nullable|integer|min:0',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        $recipe = Recipe::create($validated);

        if (!empty($tagIds)) {
            $recipe->tags()->attach($tagIds);
        }

        return new RecipeResource($recipe->load('tags'));
    }

    public function update(Request $request, Recipe $recipe): RecipeResource
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'dietary_tags' => 'nullable|array',
            'ingredients' => 'nullable|array',
            'instructions' => 'nullable|string',
            'servings' => 'nullable|integer|min:1',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'cook_time_minutes' => 'nullable|integer|min:0',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        $recipe->update($validated);

        if ($tagIds !== null) {
            $recipe->tags()->sync($tagIds);
        }

        return new RecipeResource($recipe->load('tags'));
    }

    public function destroy(Recipe $recipe): Response
    {
        $recipe->delete();

        return response()->noContent();
    }
}
