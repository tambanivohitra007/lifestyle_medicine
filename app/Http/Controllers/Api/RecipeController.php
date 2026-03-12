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

/**
 * Manages therapeutic recipes linked to conditions and interventions.
 *
 * Provides CRUD operations for recipes with dietary tag filtering,
 * content tag management, and publishing workflow support.
 *
 * Routes: /api/v1/recipes (public), /api/v1/admin/recipes (admin)
 */
class RecipeController extends Controller
{
    use HasSorting;

    /**
     * List all recipes with optional filtering, search, and sorting.
     *
     * Admin/editor users can filter by publishing status; public users see only published.
     * Supports dietary_tag filtering (JSON contains), tag_id filtering, and search.
     *
     * GET /api/v1/recipes
     *
     * @param  Request  $request  Query params: status, search, dietary_tag, tag_id, sort_by, sort_order
     * @return AnonymousResourceCollection Paginated collection of RecipeResource (20 per page)
     */
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

    /**
     * Display a single recipe with its related data.
     *
     * GET /api/v1/recipes/{recipe}
     *
     * @param  Recipe  $recipe  Route-model bound recipe instance
     * @return RecipeResource
     */
    public function show(Recipe $recipe): RecipeResource
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $recipe->isPublished()) {
            abort(404);
        }

        $recipe->load(['conditions', 'interventions', 'tags', 'creator', 'updater']);

        return new RecipeResource($recipe);
    }

    /**
     * Publish a recipe.
     *
     * POST /api/v1/admin/recipes/{recipe}/publish (admin only)
     *
     * @param  Recipe  $recipe  Route-model bound recipe instance
     * @return JsonResponse Success message
     */
    public function publish(Recipe $recipe): JsonResponse
    {
        $recipe->publish();

        return response()->json(['message' => 'Recipe published successfully']);
    }

    /**
     * Submit a recipe for editorial review.
     *
     * POST /api/v1/admin/recipes/{recipe}/submit-for-review
     *
     * @param  Recipe  $recipe  Route-model bound recipe instance
     * @return JsonResponse Success message
     */
    public function submitForReview(Recipe $recipe): JsonResponse
    {
        $recipe->submitForReview();

        return response()->json(['message' => 'Recipe submitted for review']);
    }

    /**
     * Archive a recipe.
     *
     * POST /api/v1/admin/recipes/{recipe}/archive (admin only)
     *
     * @param  Recipe  $recipe  Route-model bound recipe instance
     * @return JsonResponse Success message
     */
    public function archive(Recipe $recipe): JsonResponse
    {
        $recipe->archive();

        return response()->json(['message' => 'Recipe archived successfully']);
    }

    /**
     * Return a recipe to draft status.
     *
     * POST /api/v1/admin/recipes/{recipe}/return-to-draft
     *
     * @param  Recipe  $recipe  Route-model bound recipe instance
     * @return JsonResponse Success message
     */
    public function returnToDraft(Recipe $recipe): JsonResponse
    {
        $recipe->returnToDraft();

        return response()->json(['message' => 'Recipe returned to draft']);
    }

    /**
     * Create a new recipe.
     *
     * POST /api/v1/admin/recipes
     *
     * @param  Request  $request  Validated fields: title, description, dietary_tags, ingredients, instructions, servings, prep/cook times, tag_ids
     * @return RecipeResource The newly created recipe
     */
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

    /**
     * Update an existing recipe.
     *
     * PUT /api/v1/admin/recipes/{recipe}
     *
     * @param  Request  $request  Validated fields: title, description, dietary_tags, ingredients, instructions, servings, prep/cook times, tag_ids
     * @param  Recipe   $recipe   Route-model bound recipe instance
     * @return RecipeResource The updated recipe
     */
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

    /**
     * Soft-delete a recipe.
     *
     * DELETE /api/v1/admin/recipes/{recipe}
     *
     * @param  Recipe  $recipe  Route-model bound recipe instance
     * @return Response 204 No Content
     */
    public function destroy(Recipe $recipe): Response
    {
        $recipe->delete();

        return response()->noContent();
    }
}
