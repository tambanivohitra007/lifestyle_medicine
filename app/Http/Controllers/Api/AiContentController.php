<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateAiDraftJob;
use App\Jobs\StructureAiContentJob;
use App\Models\AiGenerationRequest;
use App\Services\AiContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiContentController extends Controller
{
    protected AiContentService $aiService;

    public function __construct(AiContentService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Check if AI service is configured.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'configured' => $this->aiService->isConfigured(),
        ]);
    }

    /**
     * Queue a human-readable draft generation for a condition.
     * Returns a request ID for polling.
     */
    public function generateDraft(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'condition_name' => 'required|string|max:255',
            'context' => 'nullable|string|max:2000',
        ]);

        $aiRequest = AiGenerationRequest::create([
            'type' => 'draft',
            'condition_name' => $validated['condition_name'],
            'input_data' => ['context' => $validated['context'] ?? ''],
            'status' => 'pending',
            'requested_by' => $request->user()->id,
        ]);

        GenerateAiDraftJob::dispatch($aiRequest);

        return response()->json([
            'request_id' => $aiRequest->id,
            'status' => 'pending',
            'message' => 'Draft generation has been queued.',
        ], 202);
    }

    /**
     * Queue conversion of approved draft into structured JSON.
     * Returns a request ID for polling.
     */
    public function structureContent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'condition_name' => 'required|string|max:255',
            'approved_draft' => 'required|string',
        ]);

        $aiRequest = AiGenerationRequest::create([
            'type' => 'structure',
            'condition_name' => $validated['condition_name'],
            'input_data' => ['approved_draft' => $validated['approved_draft']],
            'status' => 'pending',
            'requested_by' => $request->user()->id,
        ]);

        StructureAiContentJob::dispatch($aiRequest);

        return response()->json([
            'request_id' => $aiRequest->id,
            'status' => 'pending',
            'message' => 'Content structuring has been queued.',
        ], 202);
    }

    /**
     * Poll the status of an AI generation request.
     */
    public function requestStatus(AiGenerationRequest $aiRequest): JsonResponse
    {
        return response()->json([
            'id' => $aiRequest->id,
            'type' => $aiRequest->type,
            'status' => $aiRequest->status,
            'condition_name' => $aiRequest->condition_name,
            'output_data' => $aiRequest->status === 'completed' ? $aiRequest->output_data : null,
            'error_message' => $aiRequest->status === 'failed' ? $aiRequest->error_message : null,
            'attempts' => $aiRequest->attempts,
            'created_at' => $aiRequest->created_at,
            'updated_at' => $aiRequest->updated_at,
        ]);
    }

    /**
     * Import structured content into the database.
     * This remains synchronous as it's a DB operation, not an AI call.
     */
    public function importContent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'structured' => 'required|array',
            'structured.condition' => 'required|array',
            'structured.condition.name' => 'required|string|max:255',
            'structured.condition.category' => 'nullable|string|max:255',
            'structured.condition.summary' => 'nullable|string|max:5000',
            'structured.condition_sections' => 'nullable|array',
            'structured.condition_sections.*.section_type' => 'required|string|in:risk_factors,physiology,complications,solutions,additional_factors,scripture',
            'structured.condition_sections.*.title' => 'nullable|string|max:255',
            'structured.condition_sections.*.body' => 'required|string',
            'structured.condition_sections.*.order_index' => 'nullable|integer|min:0',
            'structured.interventions' => 'nullable|array',
            'structured.interventions.*.name' => 'required|string|max:255',
            'structured.interventions.*.care_domain' => 'required|string|max:255',
            'structured.interventions.*.description' => 'nullable|string',
            'structured.interventions.*.mechanism' => 'nullable|string',
            'structured.interventions.*.pivot' => 'nullable|array',
            'structured.interventions.*.pivot.strength_of_evidence' => 'nullable|string|in:high,moderate,emerging,insufficient',
            'structured.interventions.*.pivot.recommendation_level' => 'nullable|string|in:core,adjunct,optional',
            'structured.interventions.*.pivot.clinical_notes' => 'nullable|string',
            'structured.interventions.*.pivot.order_index' => 'nullable|integer|min:0',
            'structured.evidence_entries' => 'nullable|array',
            'structured.evidence_entries.*.intervention_name' => 'required|string|max:255',
            'structured.evidence_entries.*.study_type' => 'nullable|string|max:100',
            'structured.evidence_entries.*.population' => 'nullable|string|max:500',
            'structured.evidence_entries.*.quality_rating' => 'nullable|string|in:A,B,C,D',
            'structured.evidence_entries.*.summary' => 'required|string',
            'structured.evidence_entries.*.notes' => 'nullable|string',
            'structured.evidence_entries.*.references' => 'nullable|array',
            'structured.evidence_entries.*.references.*.citation' => 'required|string',
            'structured.scriptures' => 'nullable|array',
            'structured.scriptures.*.reference' => 'required|string|max:255',
            'structured.scriptures.*.text' => 'required|string',
            'structured.scriptures.*.theme' => 'nullable|string|max:255',
            'structured.egw_references' => 'nullable|array',
            'structured.egw_references.*.book' => 'required|string|max:255',
            'structured.egw_references.*.quote' => 'required|string',
            'structured.egw_references.*.book_abbreviation' => 'nullable|string|max:10',
            'structured.egw_references.*.chapter' => 'nullable|string|max:255',
            'structured.egw_references.*.page_start' => 'nullable|integer',
            'structured.egw_references.*.page_end' => 'nullable|integer',
            'structured.egw_references.*.topic' => 'nullable|string|max:255',
            'structured.egw_references.*.context' => 'nullable|string',
            'structured.recipes' => 'nullable|array',
            'structured.recipes.*.title' => 'required|string|max:255',
            'structured.recipes.*.description' => 'nullable|string',
            'structured.recipes.*.dietary_tags' => 'nullable|array',
            'structured.recipes.*.dietary_tags.*' => 'string|max:50',
            'structured.recipes.*.ingredients' => 'nullable',
            'structured.recipes.*.instructions' => 'nullable|string',
            'structured.recipes.*.servings' => 'nullable|integer|min:1',
            'structured.recipes.*.prep_time_minutes' => 'nullable|integer|min:0',
            'structured.recipes.*.cook_time_minutes' => 'nullable|integer|min:0',
            'structured.content_tags' => 'nullable|array',
            'structured.content_tags.*' => 'string|max:100',
        ]);

        $structured = $validated['structured'];

        $result = $this->aiService->importContent($structured);

        if (isset($result['error'])) {
            return response()->json($result, 422);
        }

        // Transform results into a cleaner format for the frontend
        $results = $result['results'] ?? [];

        return response()->json([
            'success' => true,
            'condition_id' => $results['condition'] ?? null,
            'sections_created' => count($results['condition_sections'] ?? []),
            'interventions_created' => count($results['interventions'] ?? []),
            'evidence_entries_created' => count($results['evidence_entries'] ?? []),
            'scriptures_created' => count($results['scriptures'] ?? []),
            'egw_references_created' => count($results['egw_references'] ?? []),
            'recipes_created' => count($results['recipes'] ?? []),
            'tags_created' => count($results['content_tags'] ?? []),
            'errors' => $results['errors'] ?? [],
        ]);
    }
}
