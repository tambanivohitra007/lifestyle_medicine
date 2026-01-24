<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
     * Generate a human-readable draft for a condition.
     */
    public function generateDraft(Request $request): JsonResponse
    {
        // Extend execution time for AI requests
        set_time_limit(180);

        $validated = $request->validate([
            'condition_name' => 'required|string|max:255',
            'context' => 'nullable|string|max:2000',
        ]);

        $result = $this->aiService->generateDraft(
            $validated['condition_name'],
            $validated['context'] ?? ''
        );

        if (isset($result['error'])) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    /**
     * Convert approved draft into structured JSON.
     */
    public function structureContent(Request $request): JsonResponse
    {
        // Extend execution time for AI requests
        set_time_limit(180);

        $validated = $request->validate([
            'condition_name' => 'required|string|max:255',
            'approved_draft' => 'required|string',
        ]);

        $result = $this->aiService->structureContent(
            $validated['condition_name'],
            $validated['approved_draft']
        );

        if (isset($result['error'])) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    /**
     * Import structured content into the database.
     */
    public function importContent(Request $request): JsonResponse
    {
        // Extend execution time for database operations
        set_time_limit(120);

        // Validate minimum required fields
        $request->validate([
            'structured' => 'required|array',
            'structured.condition' => 'required|array',
            'structured.condition.name' => 'required|string|max:255',
        ]);

        // Use the full structured data, not just validated fields
        // Validation above ensures minimum required fields exist
        $structured = $request->input('structured');

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
