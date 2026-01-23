<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BibleApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BibleController extends Controller
{
    protected BibleApiService $bibleService;

    public function __construct(BibleApiService $bibleService)
    {
        $this->bibleService = $bibleService;
    }

    /**
     * Get list of available Bible versions.
     */
    public function getBibles(Request $request): JsonResponse
    {
        $options = [];

        if ($request->has('language')) {
            $options['language'] = $request->language;
        }

        $result = $this->bibleService->getBibles($options);

        if (isset($result['error'])) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Search for verses by keyword or reference.
     */
    public function searchVerses(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|max:500',
            'bible_id' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $result = $this->bibleService->searchVerses(
            $validated['query'],
            $validated['bible_id'] ?? null,
            $validated['limit'] ?? 10
        );

        if (isset($result['error'])) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get a specific verse by reference.
     */
    public function getVerse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => 'required|string|max:100',
            'bible_id' => 'nullable|string',
        ]);

        // First try to parse the reference
        $verseId = $this->bibleService->parseReference($validated['reference']);

        if (!$verseId) {
            // If parsing fails, try searching
            $searchResult = $this->bibleService->searchVerses(
                $validated['reference'],
                $validated['bible_id'] ?? null,
                1
            );

            if (isset($searchResult['error']) || empty($searchResult['data']['verses'])) {
                return response()->json([
                    'error' => 'Could not find the specified verse.',
                ], 404);
            }

            // Use the first search result
            $verseId = $searchResult['data']['verses'][0]['id'] ?? null;
        }

        if (!$verseId) {
            return response()->json([
                'error' => 'Invalid verse reference.',
            ], 400);
        }

        // Check if it's a passage (contains dash)
        if (str_contains($verseId, '-')) {
            $result = $this->bibleService->getPassage($verseId, $validated['bible_id'] ?? null);
        } else {
            $result = $this->bibleService->getVerse($verseId, $validated['bible_id'] ?? null);
        }

        if (isset($result['error'])) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get a passage (range of verses).
     */
    public function getPassage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'passage_id' => 'required|string|max:100',
            'bible_id' => 'nullable|string',
        ]);

        $result = $this->bibleService->getPassage(
            $validated['passage_id'],
            $validated['bible_id'] ?? null
        );

        if (isset($result['error'])) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }
}
