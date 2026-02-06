<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InterventionContraindicationResource;
use App\Http\Resources\InterventionOutcomeResource;
use App\Http\Resources\InterventionProtocolResource;
use App\Http\Resources\ProtocolStepResource;
use App\Models\Intervention;
use App\Models\InterventionContraindication;
use App\Models\InterventionOutcome;
use App\Models\InterventionProtocol;
use App\Models\ProtocolStep;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class InterventionProtocolController extends Controller
{
    /**
     * Get complete protocol data for an intervention.
     */
    public function show(Intervention $intervention): JsonResponse
    {
        $intervention->load([
            'protocol.steps',
            'contraindications.condition',
            'outcomes',
        ]);

        return response()->json([
            'data' => [
                'protocol' => $intervention->protocol
                    ? new InterventionProtocolResource($intervention->protocol)
                    : null,
                'contraindications' => InterventionContraindicationResource::collection(
                    $intervention->contraindications
                ),
                'outcomes' => InterventionOutcomeResource::collection(
                    $intervention->outcomes
                ),
            ],
        ]);
    }

    /**
     * Create or update protocol for an intervention.
     */
    public function storeOrUpdateProtocol(Request $request, Intervention $intervention): InterventionProtocolResource
    {
        $validated = $request->validate([
            'version' => 'nullable|string|max:20',
            'duration_weeks' => 'nullable|integer|min:1|max:520',
            'frequency_per_week' => 'nullable|integer|min:1|max:21',
            'intensity_level' => 'nullable|in:low,moderate,high,variable',
            'overview' => 'nullable|string',
            'prerequisites' => 'nullable|string',
            'equipment_needed' => 'nullable|string',
        ]);

        $protocol = InterventionProtocol::updateOrCreate(
            ['intervention_id' => $intervention->id],
            $validated
        );

        return new InterventionProtocolResource($protocol->load('steps'));
    }

    /**
     * Delete protocol for an intervention.
     */
    public function destroyProtocol(Intervention $intervention): Response
    {
        if ($intervention->protocol) {
            $intervention->protocol->delete();
        }

        return response()->noContent();
    }

    // ==================== PROTOCOL STEPS ====================

    /**
     * Add a step to protocol.
     */
    public function storeStep(Request $request, Intervention $intervention): ProtocolStepResource
    {
        $protocol = $intervention->protocol;

        if (!$protocol) {
            $protocol = InterventionProtocol::create([
                'intervention_id' => $intervention->id,
            ]);
        }

        $validated = $request->validate([
            'step_number' => 'required|integer|min:1',
            'phase_name' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'nullable|integer|min:1',
            'week_start' => 'nullable|integer|min:1',
            'week_end' => 'nullable|integer|min:1',
            'frequency' => 'nullable|string|max:100',
            'instructions' => 'nullable|string',
            'tips' => 'nullable|string',
        ]);

        $validated['protocol_id'] = $protocol->id;

        $step = ProtocolStep::create($validated);

        return new ProtocolStepResource($step);
    }

    /**
     * Update a protocol step.
     */
    public function updateStep(Request $request, ProtocolStep $step): ProtocolStepResource
    {
        $validated = $request->validate([
            'step_number' => 'sometimes|required|integer|min:1',
            'phase_name' => 'nullable|string|max:255',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'nullable|integer|min:1',
            'week_start' => 'nullable|integer|min:1',
            'week_end' => 'nullable|integer|min:1',
            'frequency' => 'nullable|string|max:100',
            'instructions' => 'nullable|string',
            'tips' => 'nullable|string',
        ]);

        $step->update($validated);

        return new ProtocolStepResource($step);
    }

    /**
     * Delete a protocol step.
     */
    public function destroyStep(ProtocolStep $step): Response
    {
        $step->delete();

        return response()->noContent();
    }

    /**
     * Reorder protocol steps.
     */
    public function reorderSteps(Request $request, Intervention $intervention): JsonResponse
    {
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|uuid',
        ]);

        foreach ($validated['order'] as $index => $stepId) {
            ProtocolStep::where('id', $stepId)->update(['step_number' => $index + 1]);
        }

        return response()->json(['message' => 'Steps reordered successfully']);
    }

    // ==================== CONTRAINDICATIONS ====================

    /**
     * Get contraindications for an intervention.
     */
    public function contraindications(Intervention $intervention): AnonymousResourceCollection
    {
        return InterventionContraindicationResource::collection(
            $intervention->contraindications()->with('condition')->get()
        );
    }

    /**
     * Add a contraindication.
     */
    public function storeContraindication(Request $request, Intervention $intervention): InterventionContraindicationResource
    {
        $validated = $request->validate([
            'condition_id' => 'nullable|uuid|exists:conditions,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'severity' => 'required|in:absolute,relative,caution',
            'alternative_recommendation' => 'nullable|string',
        ]);

        $validated['intervention_id'] = $intervention->id;

        $contraindication = InterventionContraindication::create($validated);

        return new InterventionContraindicationResource($contraindication->load('condition'));
    }

    /**
     * Update a contraindication.
     */
    public function updateContraindication(Request $request, InterventionContraindication $contraindication): InterventionContraindicationResource
    {
        $validated = $request->validate([
            'condition_id' => 'nullable|uuid|exists:conditions,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'severity' => 'sometimes|required|in:absolute,relative,caution',
            'alternative_recommendation' => 'nullable|string',
        ]);

        $contraindication->update($validated);

        return new InterventionContraindicationResource($contraindication->load('condition'));
    }

    /**
     * Delete a contraindication.
     */
    public function destroyContraindication(InterventionContraindication $contraindication): Response
    {
        $contraindication->delete();

        return response()->noContent();
    }

    // ==================== OUTCOMES ====================

    /**
     * Get outcomes for an intervention.
     */
    public function outcomes(Intervention $intervention): AnonymousResourceCollection
    {
        return InterventionOutcomeResource::collection($intervention->outcomes);
    }

    /**
     * Add an expected outcome.
     */
    public function storeOutcome(Request $request, Intervention $intervention): InterventionOutcomeResource
    {
        $validated = $request->validate([
            'outcome_measure' => 'required|string|max:255',
            'expected_change' => 'nullable|string|max:100',
            'direction' => 'nullable|string|max:50',
            'timeline_weeks' => 'nullable|integer|min:1|max:520',
            'evidence_grade' => 'nullable|in:A,B,C,D',
            'measurement_method' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $validated['intervention_id'] = $intervention->id;

        // Auto-set order_index if not provided
        if (!isset($validated['order_index'])) {
            $validated['order_index'] = $intervention->outcomes()->max('order_index') + 1;
        }

        $outcome = InterventionOutcome::create($validated);

        return new InterventionOutcomeResource($outcome);
    }

    /**
     * Update an expected outcome.
     */
    public function updateOutcome(Request $request, InterventionOutcome $outcome): InterventionOutcomeResource
    {
        $validated = $request->validate([
            'outcome_measure' => 'sometimes|required|string|max:255',
            'expected_change' => 'nullable|string|max:100',
            'direction' => 'nullable|string|max:50',
            'timeline_weeks' => 'nullable|integer|min:1|max:520',
            'evidence_grade' => 'nullable|in:A,B,C,D',
            'measurement_method' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $outcome->update($validated);

        return new InterventionOutcomeResource($outcome);
    }

    /**
     * Delete an expected outcome.
     */
    public function destroyOutcome(InterventionOutcome $outcome): Response
    {
        $outcome->delete();

        return response()->noContent();
    }

    /**
     * Reorder outcomes.
     */
    public function reorderOutcomes(Request $request, Intervention $intervention): JsonResponse
    {
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|uuid',
        ]);

        foreach ($validated['order'] as $index => $outcomeId) {
            InterventionOutcome::where('id', $outcomeId)->update(['order_index' => $index]);
        }

        return response()->json(['message' => 'Outcomes reordered successfully']);
    }
}
