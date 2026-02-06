<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InterventionRelationshipResource;
use App\Models\Intervention;
use App\Models\InterventionRelationship;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class InterventionRelationshipController extends Controller
{
    /**
     * List all intervention relationships.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = InterventionRelationship::with(['interventionA.careDomain', 'interventionB.careDomain']);

        if ($request->has('type')) {
            $query->where('relationship_type', $request->type);
        }

        if ($request->boolean('synergies')) {
            $query->synergies();
        }

        if ($request->boolean('conflicts')) {
            $query->conflicts();
        }

        return InterventionRelationshipResource::collection(
            $query->paginate($request->get('per_page', 20))
        );
    }

    /**
     * Get all relationships for a specific intervention.
     */
    public function forIntervention(Intervention $intervention): AnonymousResourceCollection
    {
        $relationships = InterventionRelationship::involving($intervention->id)
            ->with(['interventionA.careDomain', 'interventionB.careDomain'])
            ->get();

        return InterventionRelationshipResource::collection($relationships);
    }

    /**
     * Get synergistic interventions for a specific intervention.
     */
    public function synergies(Intervention $intervention): AnonymousResourceCollection
    {
        $relationships = InterventionRelationship::involving($intervention->id)
            ->synergies()
            ->with(['interventionA.careDomain', 'interventionB.careDomain'])
            ->get();

        return InterventionRelationshipResource::collection($relationships);
    }

    /**
     * Get conflicting interventions for a specific intervention.
     */
    public function conflicts(Intervention $intervention): AnonymousResourceCollection
    {
        $relationships = InterventionRelationship::involving($intervention->id)
            ->conflicts()
            ->with(['interventionA.careDomain', 'interventionB.careDomain'])
            ->get();

        return InterventionRelationshipResource::collection($relationships);
    }

    /**
     * Create a new relationship.
     */
    public function store(Request $request): InterventionRelationshipResource
    {
        $validated = $request->validate([
            'intervention_a_id' => 'required|uuid|exists:interventions,id',
            'intervention_b_id' => 'required|uuid|exists:interventions,id|different:intervention_a_id',
            'relationship_type' => 'required|in:synergy,complementary,neutral,caution,conflict',
            'description' => 'nullable|string',
            'clinical_notes' => 'nullable|string',
        ]);

        // Ensure we don't have a duplicate (check both directions)
        $existing = InterventionRelationship::where(function ($q) use ($validated) {
            $q->where('intervention_a_id', $validated['intervention_a_id'])
              ->where('intervention_b_id', $validated['intervention_b_id']);
        })->orWhere(function ($q) use ($validated) {
            $q->where('intervention_a_id', $validated['intervention_b_id'])
              ->where('intervention_b_id', $validated['intervention_a_id']);
        })->first();

        if ($existing) {
            return response()->json([
                'message' => 'A relationship already exists between these interventions',
                'existing_id' => $existing->id,
            ], 422);
        }

        $relationship = InterventionRelationship::create($validated);

        return new InterventionRelationshipResource(
            $relationship->load(['interventionA.careDomain', 'interventionB.careDomain'])
        );
    }

    /**
     * Update a relationship.
     */
    public function update(Request $request, InterventionRelationship $relationship): InterventionRelationshipResource
    {
        $validated = $request->validate([
            'relationship_type' => 'sometimes|required|in:synergy,complementary,neutral,caution,conflict',
            'description' => 'nullable|string',
            'clinical_notes' => 'nullable|string',
        ]);

        $relationship->update($validated);

        return new InterventionRelationshipResource(
            $relationship->load(['interventionA.careDomain', 'interventionB.careDomain'])
        );
    }

    /**
     * Delete a relationship.
     */
    public function destroy(InterventionRelationship $relationship): Response
    {
        $relationship->delete();

        return response()->noContent();
    }
}
