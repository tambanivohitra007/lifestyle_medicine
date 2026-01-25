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
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ConditionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Condition::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('summary', 'like', '%' . $request->search . '%');
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSortColumns = ['name', 'category', 'created_at', 'updated_at'];
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'created_at';
        }

        // Validate sort order
        $sortOrder = in_array(strtolower($sortOrder), ['asc', 'desc']) ? $sortOrder : 'desc';

        $query->orderBy($sortBy, $sortOrder);

        $conditions = $query->paginate(20);

        return ConditionResource::collection($conditions);
    }

    public function show(Condition $condition): ConditionResource
    {
        $condition->load(['sections', 'interventions.careDomain', 'creator', 'updater']);

        return new ConditionResource($condition);
    }

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
        ]);

        $condition = Condition::create($validated);

        return new ConditionResource($condition);
    }

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
        ]);

        $condition->update($validated);

        return new ConditionResource($condition);
    }

    public function destroy(Condition $condition): Response
    {
        $condition->delete();

        return response()->noContent();
    }

    public function sections(Condition $condition): AnonymousResourceCollection
    {
        $sections = $condition->sections()->orderBy('order_index')->get();

        return ConditionSectionResource::collection($sections);
    }

    public function interventions(Condition $condition): AnonymousResourceCollection
    {
        $interventions = $condition->interventions()
            ->with('careDomain')
            ->withPivot(['strength_of_evidence', 'recommendation_level', 'clinical_notes', 'order_index'])
            ->orderBy('condition_interventions.order_index')
            ->get();

        return InterventionResource::collection($interventions);
    }

    public function scriptures(Condition $condition): AnonymousResourceCollection
    {
        return ScriptureResource::collection($condition->scriptures);
    }

    public function recipes(Condition $condition): AnonymousResourceCollection
    {
        return RecipeResource::collection($condition->recipes);
    }

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

    public function detachIntervention(Condition $condition, Intervention $intervention): JsonResponse
    {
        $condition->interventions()->detach($intervention->id);

        return response()->json(['message' => 'Intervention detached successfully']);
    }

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
                ->pivot
        ]);
    }

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

    public function attachScripture(Condition $condition, Scripture $scripture): JsonResponse
    {
        // Check if already attached
        if ($condition->scriptures()->where('scripture_id', $scripture->id)->exists()) {
            return response()->json(['message' => 'Scripture is already attached'], 422);
        }

        $condition->scriptures()->attach($scripture->id);

        return response()->json(['message' => 'Scripture attached successfully']);
    }

    public function detachScripture(Condition $condition, Scripture $scripture): JsonResponse
    {
        $condition->scriptures()->detach($scripture->id);

        return response()->json(['message' => 'Scripture detached successfully']);
    }

    public function attachRecipe(Condition $condition, Recipe $recipe): JsonResponse
    {
        // Check if already attached
        if ($condition->recipes()->where('recipe_id', $recipe->id)->exists()) {
            return response()->json(['message' => 'Recipe is already attached'], 422);
        }

        $condition->recipes()->attach($recipe->id);

        return response()->json(['message' => 'Recipe attached successfully']);
    }

    public function detachRecipe(Condition $condition, Recipe $recipe): JsonResponse
    {
        $condition->recipes()->detach($recipe->id);

        return response()->json(['message' => 'Recipe detached successfully']);
    }

    public function egwReferences(Condition $condition): AnonymousResourceCollection
    {
        return EgwReferenceResource::collection($condition->egwReferences);
    }

    public function attachEgwReference(Condition $condition, EgwReference $egwReference): JsonResponse
    {
        // Check if already attached
        if ($condition->egwReferences()->where('egw_reference_id', $egwReference->id)->exists()) {
            return response()->json(['message' => 'EGW reference is already attached'], 422);
        }

        $condition->egwReferences()->attach($egwReference->id);

        return response()->json(['message' => 'EGW reference attached successfully']);
    }

    public function detachEgwReference(Condition $condition, EgwReference $egwReference): JsonResponse
    {
        $condition->egwReferences()->detach($egwReference->id);

        return response()->json(['message' => 'EGW reference detached successfully']);
    }
}
