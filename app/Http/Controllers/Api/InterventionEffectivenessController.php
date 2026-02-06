<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InterventionEffectivenessResource;
use App\Models\Condition;
use App\Models\Intervention;
use App\Models\InterventionEffectiveness;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class InterventionEffectivenessController extends Controller
{
    /**
     * List all effectiveness ratings with filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = InterventionEffectiveness::with(['intervention.careDomain', 'condition']);

        if ($request->has('condition_id')) {
            $query->where('condition_id', $request->condition_id);
        }

        if ($request->has('intervention_id')) {
            $query->where('intervention_id', $request->intervention_id);
        }

        if ($request->has('rating')) {
            $query->where('effectiveness_rating', $request->rating);
        }

        if ($request->boolean('primary_only')) {
            $query->primary();
        }

        if ($request->boolean('high_effectiveness')) {
            $query->highEffectiveness();
        }

        return InterventionEffectivenessResource::collection(
            $query->paginate($request->get('per_page', 20))
        );
    }

    /**
     * Get effectiveness ratings for a specific condition.
     */
    public function forCondition(Condition $condition): AnonymousResourceCollection
    {
        $ratings = InterventionEffectiveness::where('condition_id', $condition->id)
            ->with(['intervention.careDomain'])
            ->orderByRaw("FIELD(effectiveness_rating, 'very_high', 'high', 'moderate', 'low', 'uncertain')")
            ->orderBy('is_primary', 'desc')
            ->get();

        return InterventionEffectivenessResource::collection($ratings);
    }

    /**
     * Get effectiveness ratings for a specific intervention.
     */
    public function forIntervention(Intervention $intervention): AnonymousResourceCollection
    {
        $ratings = InterventionEffectiveness::where('intervention_id', $intervention->id)
            ->with(['condition'])
            ->orderByRaw("FIELD(effectiveness_rating, 'very_high', 'high', 'moderate', 'low', 'uncertain')")
            ->get();

        return InterventionEffectivenessResource::collection($ratings);
    }

    /**
     * Get effectiveness for a specific condition-intervention pair.
     */
    public function forPair(Condition $condition, Intervention $intervention): JsonResponse
    {
        $rating = InterventionEffectiveness::where('condition_id', $condition->id)
            ->where('intervention_id', $intervention->id)
            ->first();

        return response()->json([
            'data' => $rating ? new InterventionEffectivenessResource($rating) : null,
        ]);
    }

    /**
     * Create or update an effectiveness rating.
     */
    public function store(Request $request): InterventionEffectivenessResource
    {
        $validated = $request->validate([
            'intervention_id' => 'required|uuid|exists:interventions,id',
            'condition_id' => 'required|uuid|exists:conditions,id',
            'effectiveness_rating' => 'required|in:very_high,high,moderate,low,uncertain',
            'evidence_grade' => 'nullable|in:A,B,C,D',
            'is_primary' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $rating = InterventionEffectiveness::updateOrCreate(
            [
                'intervention_id' => $validated['intervention_id'],
                'condition_id' => $validated['condition_id'],
            ],
            $validated
        );

        return new InterventionEffectivenessResource($rating->load(['intervention', 'condition']));
    }

    /**
     * Update an effectiveness rating.
     */
    public function update(Request $request, InterventionEffectiveness $effectiveness): InterventionEffectivenessResource
    {
        $validated = $request->validate([
            'effectiveness_rating' => 'sometimes|required|in:very_high,high,moderate,low,uncertain',
            'evidence_grade' => 'nullable|in:A,B,C,D',
            'is_primary' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $effectiveness->update($validated);

        return new InterventionEffectivenessResource($effectiveness->load(['intervention', 'condition']));
    }

    /**
     * Delete an effectiveness rating.
     */
    public function destroy(InterventionEffectiveness $effectiveness): Response
    {
        $effectiveness->delete();

        return response()->noContent();
    }
}
