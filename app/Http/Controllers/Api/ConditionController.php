<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConditionResource;
use App\Http\Resources\ConditionSectionResource;
use App\Http\Resources\EgwReferenceResource;
use App\Http\Resources\InterventionResource;
use App\Http\Resources\RecipeResource;
use App\Http\Resources\ScriptureResource;
use App\Models\Condition;
use App\Models\EgwReference;
use App\Models\Intervention;
use App\Models\Recipe;
use App\Models\Scripture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * Manages health conditions (diseases/disorders) in the knowledge platform.
 *
 * Provides CRUD operations for conditions along with relationship management
 * for interventions, scriptures, recipes, and EGW references. Supports
 * publishing workflow (draft, review, published, archived) and role-based
 * access control for status filtering.
 *
 * Routes: /api/v1/conditions (public), /api/v1/admin/conditions (admin)
 */
class ConditionController extends Controller
{
    /**
     * List all conditions with optional filtering, search, and sorting.
     *
     * Admin/editor users can filter by publishing status; public users see only published.
     * Supports filtering by category, search by name/summary, and sortable columns.
     *
     * GET /api/v1/conditions
     *
     * @param  Request  $request  Query params: status, category, search, sort_by, sort_order
     * @return AnonymousResourceCollection Paginated collection of ConditionResource (20 per page)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Condition::query();

        // Publishing status filtering
        $user = auth('sanctum')->user();
        if ($user && in_array($user->role, ['admin', 'editor'])) {
            if ($request->has('status')) {
                $query->withStatus($request->status);
            }
        } else {
            $query->published();
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('summary', 'like', '%'.$request->search.'%');
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSortColumns = ['name', 'category', 'created_at', 'updated_at'];
        if (! in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'created_at';
        }

        // Validate sort order
        $sortOrder = in_array(strtolower($sortOrder), ['asc', 'desc']) ? $sortOrder : 'desc';

        $query->orderBy($sortBy, $sortOrder);

        $conditions = $query->paginate(20);

        return ConditionResource::collection($conditions);
    }

    /**
     * Display a single condition with its related data.
     *
     * Non-admin/editor users cannot view unpublished conditions (returns 404).
     * Eager-loads sections, interventions, body system, and audit fields.
     *
     * GET /api/v1/conditions/{condition}
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return ConditionResource
     */
    public function show(Condition $condition): ConditionResource
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $condition->isPublished()) {
            abort(404);
        }

        $condition->load(['sections', 'interventions.careDomain', 'bodySystem', 'creator', 'updater']);

        return new ConditionResource($condition);
    }

    /**
     * Publish a condition, making it publicly visible.
     *
     * POST /api/v1/admin/conditions/{condition}/publish (admin only)
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return JsonResponse Success message
     */
    public function publish(Condition $condition): JsonResponse
    {
        $condition->publish();

        return response()->json(['message' => 'Condition published successfully']);
    }

    /**
     * Submit a condition for editorial review.
     *
     * POST /api/v1/admin/conditions/{condition}/submit-for-review
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return JsonResponse Success message
     */
    public function submitForReview(Condition $condition): JsonResponse
    {
        $condition->submitForReview();

        return response()->json(['message' => 'Condition submitted for review']);
    }

    /**
     * Archive a condition, hiding it from public view.
     *
     * POST /api/v1/admin/conditions/{condition}/archive (admin only)
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return JsonResponse Success message
     */
    public function archive(Condition $condition): JsonResponse
    {
        $condition->archive();

        return response()->json(['message' => 'Condition archived successfully']);
    }

    /**
     * Return a condition to draft status for further editing.
     *
     * POST /api/v1/admin/conditions/{condition}/return-to-draft
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return JsonResponse Success message
     */
    public function returnToDraft(Condition $condition): JsonResponse
    {
        $condition->returnToDraft();

        return response()->json(['message' => 'Condition returned to draft']);
    }

    /**
     * Get a condition with ALL related data in a single request.
     * This eliminates the need for multiple API calls on the detail page.
     */
    public function complete(Condition $condition): JsonResponse
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $condition->isPublished()) {
            abort(404);
        }

        // Load all relationships in one query
        $condition->load([
            'sections' => fn ($q) => $q->orderBy('order_index'),
            'interventions' => fn ($q) => $q->with('careDomain')
                ->withPivot(['strength_of_evidence', 'recommendation_level', 'clinical_notes', 'order_index'])
                ->orderBy('condition_interventions.order_index'),
            'scriptures',
            'recipes',
            'egwReferences',
            'media' => fn ($q) => $q->orderBy('order_index'),
            'bodySystem',
            'creator',
            'updater',
        ]);

        // Separate infographics from other media
        $infographics = $condition->media->where('type', 'infographic');
        $otherMedia = $condition->media->whereIn('type', ['image', 'document']);

        $formatMedia = fn ($media) => [
            'id' => $media->id,
            'url' => $media->url,
            'filename' => $media->filename,
            'original_filename' => $media->original_filename,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'type' => $media->type,
            'alt_text' => $media->alt_text,
            'caption' => $media->caption,
            'order_index' => $media->order_index,
            'created_at' => $media->created_at,
        ];

        return response()->json([
            'data' => [
                'condition' => new ConditionResource($condition),
                'sections' => ConditionSectionResource::collection($condition->sections),
                'interventions' => InterventionResource::collection($condition->interventions),
                'scriptures' => ScriptureResource::collection($condition->scriptures),
                'recipes' => RecipeResource::collection($condition->recipes),
                'egw_references' => EgwReferenceResource::collection($condition->egwReferences),
                'infographics' => $infographics->map($formatMedia)->values(),
                'media' => $otherMedia->map($formatMedia)->values(),
            ],
        ]);
    }

    /**
     * Create a new condition.
     *
     * POST /api/v1/admin/conditions
     *
     * @param  Request  $request  Validated fields: name, category, summary, snomed_code, icd10_code, body_system_id
     * @return ConditionResource The newly created condition
     */
    public function store(Request $request): ConditionResource
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('conditions', 'name')->whereNull('deleted_at'),
            ],
            'category' => 'nullable|string|max:255',
            'summary' => 'nullable|string',
            'snomed_code' => 'nullable|string|max:20',
            'icd10_code' => 'nullable|string|max:20',
            'body_system_id' => 'nullable|uuid|exists:body_systems,id',
        ]);

        $condition = Condition::create($validated);

        return new ConditionResource($condition->load('bodySystem'));
    }

    /**
     * Update an existing condition.
     *
     * PUT /api/v1/admin/conditions/{condition}
     *
     * @param  Request    $request    Validated fields: name, category, summary, snomed_code, icd10_code, body_system_id
     * @param  Condition  $condition  Route-model bound condition instance
     * @return ConditionResource The updated condition
     */
    public function update(Request $request, Condition $condition): ConditionResource
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('conditions', 'name')->ignore($condition->id)->whereNull('deleted_at'),
            ],
            'category' => 'nullable|string|max:255',
            'summary' => 'nullable|string',
            'snomed_code' => 'nullable|string|max:20',
            'icd10_code' => 'nullable|string|max:20',
            'body_system_id' => 'nullable|uuid|exists:body_systems,id',
        ]);

        $condition->update($validated);

        return new ConditionResource($condition->load('bodySystem'));
    }

    /**
     * Soft-delete a condition.
     *
     * DELETE /api/v1/admin/conditions/{condition}
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return Response 204 No Content
     */
    public function destroy(Condition $condition): Response
    {
        $condition->delete();

        return response()->noContent();
    }

    /**
     * List all sections for a condition, ordered by order_index.
     *
     * GET /api/v1/conditions/{condition}/sections
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return AnonymousResourceCollection Collection of ConditionSectionResource
     */
    public function sections(Condition $condition): AnonymousResourceCollection
    {
        $sections = $condition->sections()->orderBy('order_index')->get();

        return ConditionSectionResource::collection($sections);
    }

    /**
     * List all interventions linked to a condition with pivot data.
     *
     * Includes care domain, strength of evidence, recommendation level, and clinical notes.
     *
     * GET /api/v1/conditions/{condition}/interventions
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return AnonymousResourceCollection Collection of InterventionResource with pivot data
     */
    public function interventions(Condition $condition): AnonymousResourceCollection
    {
        $interventions = $condition->interventions()
            ->with('careDomain')
            ->withPivot(['strength_of_evidence', 'recommendation_level', 'clinical_notes', 'order_index'])
            ->orderBy('condition_interventions.order_index')
            ->get();

        return InterventionResource::collection($interventions);
    }

    /**
     * List all scriptures linked to a condition.
     *
     * GET /api/v1/conditions/{condition}/scriptures
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return AnonymousResourceCollection Collection of ScriptureResource
     */
    public function scriptures(Condition $condition): AnonymousResourceCollection
    {
        return ScriptureResource::collection($condition->scriptures);
    }

    /**
     * List all recipes linked to a condition.
     *
     * GET /api/v1/conditions/{condition}/recipes
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return AnonymousResourceCollection Collection of RecipeResource
     */
    public function recipes(Condition $condition): AnonymousResourceCollection
    {
        return RecipeResource::collection($condition->recipes);
    }

    /**
     * Attach an intervention to a condition with pivot metadata.
     *
     * POST /api/v1/admin/conditions/{condition}/interventions/{intervention}
     *
     * @param  Request       $request       Pivot fields: strength_of_evidence, recommendation_level, clinical_notes, order_index
     * @param  Condition     $condition     Route-model bound condition instance
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return JsonResponse Success message or 422 if already attached
     */
    public function attachIntervention(Request $request, Condition $condition, Intervention $intervention): JsonResponse
    {
        // Check if already attached
        if ($condition->interventions()->where('intervention_id', $intervention->id)->exists()) {
            return response()->json(['message' => 'Intervention is already attached'], 422);
        }

        $validated = $request->validate([
            'strength_of_evidence' => 'nullable|in:high,moderate,emerging,insufficient',
            'recommendation_level' => 'nullable|in:core,adjunct,optional',
            'clinical_notes' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        // Set defaults if not provided
        $validated['strength_of_evidence'] = $validated['strength_of_evidence'] ?? 'moderate';
        $validated['recommendation_level'] = $validated['recommendation_level'] ?? 'adjunct';

        $condition->interventions()->attach($intervention->id, $validated);

        return response()->json(['message' => 'Intervention attached successfully']);
    }

    /**
     * Detach an intervention from a condition.
     *
     * DELETE /api/v1/admin/conditions/{condition}/interventions/{intervention}
     *
     * @param  Condition     $condition     Route-model bound condition instance
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return JsonResponse Success message
     */
    public function detachIntervention(Condition $condition, Intervention $intervention): JsonResponse
    {
        $condition->interventions()->detach($intervention->id);

        return response()->json(['message' => 'Intervention detached successfully']);
    }

    /**
     * Update the pivot data for a condition-intervention relationship.
     *
     * PUT /api/v1/admin/conditions/{condition}/interventions/{intervention}
     *
     * @param  Request       $request       Pivot fields: strength_of_evidence, recommendation_level, clinical_notes, order_index
     * @param  Condition     $condition     Route-model bound condition instance
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return JsonResponse Updated pivot data
     */
    public function updateIntervention(Request $request, Condition $condition, Intervention $intervention): JsonResponse
    {
        $validated = $request->validate([
            'strength_of_evidence' => 'sometimes|required|in:high,moderate,emerging,insufficient',
            'recommendation_level' => 'sometimes|required|in:core,adjunct,optional',
            'clinical_notes' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $condition->interventions()->updateExistingPivot($intervention->id, $validated);

        return response()->json([
            'message' => 'Intervention mapping updated successfully',
            'data' => $condition->interventions()
                ->where('intervention_id', $intervention->id)
                ->withPivot(['strength_of_evidence', 'recommendation_level', 'clinical_notes', 'order_index'])
                ->first()
                ->pivot,
        ]);
    }

    /**
     * Reorder interventions for a condition by updating pivot order_index values.
     *
     * POST /api/v1/admin/conditions/{condition}/interventions/reorder
     *
     * @param  Request    $request    Array of intervention UUIDs in desired order
     * @param  Condition  $condition  Route-model bound condition instance
     * @return JsonResponse Success message
     */
    public function reorderInterventions(Request $request, Condition $condition): JsonResponse
    {
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|uuid|exists:interventions,id',
        ]);

        foreach ($validated['order'] as $index => $interventionId) {
            $condition->interventions()->updateExistingPivot($interventionId, ['order_index' => $index]);
        }

        return response()->json(['message' => 'Interventions reordered successfully']);
    }

    /**
     * Attach a scripture to a condition.
     *
     * POST /api/v1/admin/conditions/{condition}/scriptures/{scripture}
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return JsonResponse Success message or 422 if already attached
     */
    public function attachScripture(Condition $condition, Scripture $scripture): JsonResponse
    {
        // Check if already attached
        if ($condition->scriptures()->where('scripture_id', $scripture->id)->exists()) {
            return response()->json(['message' => 'Scripture is already attached'], 422);
        }

        $condition->scriptures()->attach($scripture->id);

        return response()->json(['message' => 'Scripture attached successfully']);
    }

    /**
     * Detach a scripture from a condition.
     *
     * DELETE /api/v1/admin/conditions/{condition}/scriptures/{scripture}
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return JsonResponse Success message
     */
    public function detachScripture(Condition $condition, Scripture $scripture): JsonResponse
    {
        $condition->scriptures()->detach($scripture->id);

        return response()->json(['message' => 'Scripture detached successfully']);
    }

    /**
     * Attach a recipe to a condition.
     *
     * POST /api/v1/admin/conditions/{condition}/recipes/{recipe}
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @param  Recipe     $recipe     Route-model bound recipe instance
     * @return JsonResponse Success message or 422 if already attached
     */
    public function attachRecipe(Condition $condition, Recipe $recipe): JsonResponse
    {
        // Check if already attached
        if ($condition->recipes()->where('recipe_id', $recipe->id)->exists()) {
            return response()->json(['message' => 'Recipe is already attached'], 422);
        }

        $condition->recipes()->attach($recipe->id);

        return response()->json(['message' => 'Recipe attached successfully']);
    }

    /**
     * Detach a recipe from a condition.
     *
     * DELETE /api/v1/admin/conditions/{condition}/recipes/{recipe}
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @param  Recipe     $recipe     Route-model bound recipe instance
     * @return JsonResponse Success message
     */
    public function detachRecipe(Condition $condition, Recipe $recipe): JsonResponse
    {
        $condition->recipes()->detach($recipe->id);

        return response()->json(['message' => 'Recipe detached successfully']);
    }

    /**
     * List all EGW references linked to a condition.
     *
     * GET /api/v1/conditions/{condition}/egw-references
     *
     * @param  Condition  $condition  Route-model bound condition instance
     * @return AnonymousResourceCollection Collection of EgwReferenceResource
     */
    public function egwReferences(Condition $condition): AnonymousResourceCollection
    {
        return EgwReferenceResource::collection($condition->egwReferences);
    }

    /**
     * Attach an EGW reference to a condition.
     *
     * POST /api/v1/admin/conditions/{condition}/egw-references/{egwReference}
     *
     * @param  Condition     $condition     Route-model bound condition instance
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return JsonResponse Success message or 422 if already attached
     */
    public function attachEgwReference(Condition $condition, EgwReference $egwReference): JsonResponse
    {
        // Check if already attached
        if ($condition->egwReferences()->where('egw_reference_id', $egwReference->id)->exists()) {
            return response()->json(['message' => 'EGW reference is already attached'], 422);
        }

        $condition->egwReferences()->attach($egwReference->id);

        return response()->json(['message' => 'EGW reference attached successfully']);
    }

    /**
     * Detach an EGW reference from a condition.
     *
     * DELETE /api/v1/admin/conditions/{condition}/egw-references/{egwReference}
     *
     * @param  Condition     $condition     Route-model bound condition instance
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return JsonResponse Success message
     */
    public function detachEgwReference(Condition $condition, EgwReference $egwReference): JsonResponse
    {
        $condition->egwReferences()->detach($egwReference->id);

        return response()->json(['message' => 'EGW reference detached successfully']);
    }
}
