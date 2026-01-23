<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiSuggestionController extends Controller
{
    protected GeminiService $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Get AI suggestions for Scripture references.
     */
    public function suggestScriptures(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string|max:500',
            'context' => 'nullable|string|max:1000',
        ]);

        $result = $this->geminiService->suggestScriptures(
            $validated['topic'],
            $validated['context'] ?? ''
        );

        if (isset($result['error'])) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get AI suggestions for Ellen G. White references.
     */
    public function suggestEgwReferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string|max:500',
            'context' => 'nullable|string|max:1000',
        ]);

        $result = $this->geminiService->suggestEgwReferences(
            $validated['topic'],
            $validated['context'] ?? ''
        );

        if (isset($result['error'])) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }
}
