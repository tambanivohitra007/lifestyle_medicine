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
use Illuminate\Http\Response;

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
            'name' => 'required|string|max:255|unique:conditions,name',
            'category' => 'nullable|string|max:255',
            'summary' => 'nullable|string',
        ]);

        $condition = Condition::create($validated);

        return new ConditionResource($condition);
    }

    public function update(Request $request, Condition $condition): ConditionResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:conditions,name,' . $condition->id,
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

    public function attachIntervention(Request $request, Condition $condition, Intervention $intervention): Response
    {
        $validated = $request->validate([
            'strength_of_evidence' => 'required|in:high,moderate,emerging,insufficient',
            'recommendation_level' => 'required|in:core,adjunct,optional',
            'clinical_notes' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $condition->interventions()->attach($intervention->id, $validated);

        return response()->json(['message' => 'Intervention attached successfully']);
    }

    public function detachIntervention(Condition $condition, Intervention $intervention): Response
    {
        $condition->interventions()->detach($intervention->id);

        return response()->json(['message' => 'Intervention detached successfully']);
    }

    public function attachScripture(Condition $condition, Scripture $scripture): Response
    {
        $condition->scriptures()->attach($scripture->id);

        return response()->json(['message' => 'Scripture attached successfully']);
    }

    public function detachScripture(Condition $condition, Scripture $scripture): Response
    {
        $condition->scriptures()->detach($scripture->id);

        return response()->json(['message' => 'Scripture detached successfully']);
    }

    public function attachRecipe(Condition $condition, Recipe $recipe): Response
    {
        $condition->recipes()->attach($recipe->id);

        return response()->json(['message' => 'Recipe attached successfully']);
    }

    public function detachRecipe(Condition $condition, Recipe $recipe): Response
    {
        $condition->recipes()->detach($recipe->id);

        return response()->json(['message' => 'Recipe detached successfully']);
    }

    public function egwReferences(Condition $condition): AnonymousResourceCollection
    {
        return EgwReferenceResource::collection($condition->egwReferences);
    }

    public function attachEgwReference(Condition $condition, EgwReference $egwReference): Response
    {
        $condition->egwReferences()->attach($egwReference->id);

        return response()->json(['message' => 'EGW reference attached successfully']);
    }

    public function detachEgwReference(Condition $condition, EgwReference $egwReference): Response
    {
        $condition->egwReferences()->detach($egwReference->id);

        return response()->json(['message' => 'EGW reference detached successfully']);
    }
}
