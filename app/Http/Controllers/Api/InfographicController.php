<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\InfographicGenerationRequest;
use App\Services\InfographicGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfographicController extends Controller
{
    public function __construct(
        protected InfographicGeneratorService $generatorService
    ) {}

    /**
     * Check if Vertex AI Imagen is configured.
     */
    public function status(): JsonResponse
    {
        $status = $this->generatorService->getStatus();

        return response()->json([
            'configured' => $status['configured'],
            'details' => $status,
        ]);
    }

    /**
     * Start infographic generation for a condition.
     */
    public function generate(Request $request, Condition $condition): JsonResponse
    {
        $validated = $request->validate([
            'types' => 'sometimes|array',
            'types.*' => 'string|in:overview,risk_factors,lifestyle_solutions',
        ]);

        $result = $this->generatorService->queueGeneration(
            $condition,
            $validated['types'] ?? []
        );

        if (!$result['success']) {
            return response()->json([
                'message' => $result['error'],
            ], 422);
        }

        return response()->json([
            'message' => 'Infographic generation started',
            'requests' => collect($result['requests'])->map(fn($req) => [
                'id' => $req->id,
                'type' => $req->infographic_type,
                'status' => $req->status,
            ]),
        ]);
    }

    /**
     * Get infographic generation status for a condition.
     */
    public function getStatus(Condition $condition): JsonResponse
    {
        $status = $this->generatorService->getConditionStatus($condition);

        // Transform for API response
        $types = [];
        foreach ($status['types'] as $type => $data) {
            $types[$type] = [
                'label' => $data['label'],
                'status' => $data['status'],
                'request_id' => $data['request']?->id,
                'media' => $data['media'] ? [
                    'id' => $data['media']->id,
                    'url' => $data['media']->url,
                    'alt_text' => $data['media']->alt_text,
                ] : null,
                'error' => $data['request']?->error_message,
                'attempts' => $data['request']?->attempts ?? 0,
            ];
        }

        return response()->json([
            'types' => $types,
            'summary' => $status['summary'],
            'is_generating' => $status['is_generating'],
        ]);
    }

    /**
     * Retry a failed infographic generation.
     */
    public function retry(InfographicGenerationRequest $infographic): JsonResponse
    {
        $result = $this->generatorService->retryRequest($infographic);

        if (!$result['success']) {
            return response()->json([
                'message' => $result['error'],
            ], 422);
        }

        return response()->json([
            'message' => 'Infographic generation retry queued',
            'request' => [
                'id' => $result['request']->id,
                'type' => $result['request']->infographic_type,
                'status' => $result['request']->status,
            ],
        ]);
    }

    /**
     * Get all infographics for a condition.
     */
    public function index(Condition $condition): JsonResponse
    {
        $infographics = $condition->infographics()->get();

        return response()->json([
            'data' => $infographics->map(fn($media) => [
                'id' => $media->id,
                'url' => $media->url,
                'alt_text' => $media->alt_text,
                'caption' => $media->caption,
                'created_at' => $media->created_at,
            ]),
        ]);
    }
}
