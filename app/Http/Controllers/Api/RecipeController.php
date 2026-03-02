<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\HasSorting;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class RecipeController extends Controller
{
    use HasSorting;

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Recipe::with('tags');

        // Publishing status filtering
        $user = auth('sanctum')->user();
        if ($user && in_array($user->role, ['admin', 'editor'])) {
            if ($request->has('status')) {
                $query->withStatus($request->status);
            }
        } else {
            $query->published();
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
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

        // Apply sorting
        $allowedSortColumns = ['title', 'prep_time', 'cook_time', 'servings', 'created_at', 'updated_at'];
        $query = $this->applySorting($query, $request, $allowedSortColumns);

        $recipes = $query->paginate(20);

        return RecipeResource::collection($recipes);
    }

    public function show(Recipe $recipe): RecipeResource
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $recipe->isPublished()) {
            abort(404);
        }

        $recipe->load(['conditions', 'interventions', 'tags', 'creator', 'updater']);

        return new RecipeResource($recipe);
    }

    public function publish(Recipe $recipe): JsonResponse
    {
        $recipe->publish();

        return response()->json(['message' => 'Recipe published successfully']);
    }

    public function submitForReview(Recipe $recipe): JsonResponse
    {
        $recipe->submitForReview();

        return response()->json(['message' => 'Recipe submitted for review']);
    }

    public function archive(Recipe $recipe): JsonResponse
    {
        $recipe->archive();

        return response()->json(['message' => 'Recipe archived successfully']);
    }

    public function returnToDraft(Recipe $recipe): JsonResponse
    {
        $recipe->returnToDraft();

        return response()->json(['message' => 'Recipe returned to draft']);
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

        if (! empty($tagIds)) {
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
