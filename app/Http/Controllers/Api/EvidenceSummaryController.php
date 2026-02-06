<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EvidenceSummaryResource;
use App\Models\Condition;
use App\Models\EvidenceSummary;
use App\Models\Intervention;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class EvidenceSummaryController extends Controller
{
    /**
     * List all evidence summaries with optional filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = EvidenceSummary::with(['condition', 'intervention', 'reviewer']);

        // Filter by condition
        if ($request->has('condition_id')) {
            $query->where('condition_id', $request->condition_id);
        }

        // Filter by intervention
        if ($request->has('intervention_id')) {
            $query->where('intervention_id', $request->intervention_id);
        }

        // Filter by quality grade
        if ($request->has('quality')) {
            $query->where('overall_quality', $request->quality);
        }

        // Filter by recommendation strength
        if ($request->has('strength')) {
            $query->where('recommendation_strength', $request->strength);
        }

        // Filter by needs review
        if ($request->boolean('needs_review')) {
            $query->needsReview();
        }

        // Sort
        $sortField = $request->get('sort', 'updated_at');
        $sortDir = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDir);

        return EvidenceSummaryResource::collection(
            $query->paginate($request->get('per_page', 15))
        );
    }

    /**
     * Get a single evidence summary.
     */
    public function show(EvidenceSummary $evidenceSummary): EvidenceSummaryResource
    {
        $evidenceSummary->load(['condition', 'intervention', 'reviewer']);

        return new EvidenceSummaryResource($evidenceSummary);
    }

    /**
     * Get evidence summary for a specific condition-intervention pair.
     */
    public function forPair(Condition $condition, Intervention $intervention): JsonResponse
    {
        $summary = EvidenceSummary::where('condition_id', $condition->id)
            ->where('intervention_id', $intervention->id)
            ->with(['reviewer'])
            ->first();

        if (!$summary) {
            return response()->json([
                'data' => null,
                'message' => 'No evidence summary exists for this condition-intervention pair',
            ]);
        }

        return response()->json([
            'data' => new EvidenceSummaryResource($summary),
        ]);
    }

    /**
     * Get all evidence summaries for a condition.
     */
    public function forCondition(Condition $condition): AnonymousResourceCollection
    {
        $summaries = EvidenceSummary::where('condition_id', $condition->id)
            ->with(['intervention', 'reviewer'])
            ->orderBy('overall_quality')
            ->orderBy('recommendation_strength', 'desc')
            ->get();

        return EvidenceSummaryResource::collection($summaries);
    }

    /**
     * Get all evidence summaries for an intervention.
     */
    public function forIntervention(Intervention $intervention): AnonymousResourceCollection
    {
        $summaries = EvidenceSummary::where('intervention_id', $intervention->id)
            ->with(['condition', 'reviewer'])
            ->orderBy('overall_quality')
            ->orderBy('recommendation_strength', 'desc')
            ->get();

        return EvidenceSummaryResource::collection($summaries);
    }

    /**
     * Create a new evidence summary.
     */
    public function store(Request $request): EvidenceSummaryResource
    {
        $validated = $request->validate([
            'condition_id' => 'required|uuid|exists:conditions,id',
            'intervention_id' => 'required|uuid|exists:interventions,id',
            'summary' => 'required|string',
            'key_findings' => 'nullable|string',
            'overall_quality' => 'required|in:A,B,C,D',
            'recommendation_strength' => 'required|in:strong,weak',
            'last_reviewed' => 'nullable|date',
            'next_review_due' => 'nullable|date|after_or_equal:last_reviewed',
            'reviewer_notes' => 'nullable|string',
            'total_studies' => 'nullable|integer|min:0',
            'total_participants' => 'nullable|integer|min:0',
        ]);

        // Check for existing summary
        $existing = EvidenceSummary::where('condition_id', $validated['condition_id'])
            ->where('intervention_id', $validated['intervention_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'An evidence summary already exists for this condition-intervention pair',
                'existing_id' => $existing->id,
            ], 422);
        }

        // Set reviewed_by if last_reviewed is provided
        if (!empty($validated['last_reviewed'])) {
            $validated['reviewed_by'] = auth()->id();
        }

        $summary = EvidenceSummary::create($validated);

        return new EvidenceSummaryResource($summary->load(['condition', 'intervention', 'reviewer']));
    }

    /**
     * Update an evidence summary.
     */
    public function update(Request $request, EvidenceSummary $evidenceSummary): EvidenceSummaryResource
    {
        $validated = $request->validate([
            'summary' => 'sometimes|required|string',
            'key_findings' => 'nullable|string',
            'overall_quality' => 'sometimes|required|in:A,B,C,D',
            'recommendation_strength' => 'sometimes|required|in:strong,weak',
            'last_reviewed' => 'nullable|date',
            'next_review_due' => 'nullable|date|after_or_equal:last_reviewed',
            'reviewer_notes' => 'nullable|string',
            'total_studies' => 'nullable|integer|min:0',
            'total_participants' => 'nullable|integer|min:0',
        ]);

        // Update reviewed_by if last_reviewed is being set
        if (!empty($validated['last_reviewed'])) {
            $validated['reviewed_by'] = auth()->id();
        }

        $evidenceSummary->update($validated);

        return new EvidenceSummaryResource($evidenceSummary->load(['condition', 'intervention', 'reviewer']));
    }

    /**
     * Delete an evidence summary.
     */
    public function destroy(EvidenceSummary $evidenceSummary): Response
    {
        $evidenceSummary->delete();

        return response()->noContent();
    }

    /**
     * Get summaries that need review.
     */
    public function needingReview(Request $request): AnonymousResourceCollection
    {
        $summaries = EvidenceSummary::needsReview()
            ->with(['condition', 'intervention', 'reviewer'])
            ->orderBy('next_review_due')
            ->paginate($request->get('per_page', 15));

        return EvidenceSummaryResource::collection($summaries);
    }

    /**
     * Mark a summary as reviewed (quick action).
     */
    public function markReviewed(Request $request, EvidenceSummary $evidenceSummary): EvidenceSummaryResource
    {
        $validated = $request->validate([
            'next_review_due' => 'nullable|date|after:today',
            'reviewer_notes' => 'nullable|string',
        ]);

        $evidenceSummary->update([
            'last_reviewed' => now(),
            'next_review_due' => $validated['next_review_due'] ?? now()->addYear(),
            'reviewer_notes' => $validated['reviewer_notes'] ?? $evidenceSummary->reviewer_notes,
            'reviewed_by' => auth()->id(),
        ]);

        return new EvidenceSummaryResource($evidenceSummary->load(['condition', 'intervention', 'reviewer']));
    }
}
