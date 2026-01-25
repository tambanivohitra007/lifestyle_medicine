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
     * Look up a verse or passage by reference.
     */
    public function lookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => 'required|string|max:100',
            'bibleId' => 'nullable|string',
        ]);

        // Parse human-readable reference to API format
        $passageId = $this->bibleService->parseReference($validated['reference']);

        if (!$passageId) {
            return response()->json([
                'error' => 'Invalid reference format. Use format like "John 3:16" or "Psalm 23:1-3".'
            ], 400);
        }

        $result = $this->bibleService->lookup($passageId, $validated['bibleId'] ?? null);

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 404);
        }

        // Use the human-readable reference in the response
        $result['reference'] = $validated['reference'];

        return response()->json(['data' => $result]);
    }

    /**
     * Search for verses by keyword.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:100',
            'bibleId' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $result = $this->bibleService->search(
            $validated['query'],
            $validated['bibleId'] ?? null,
            $validated['limit'] ?? 20
        );

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 400);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Get all health-related themes.
     */
    public function getHealthThemes(): JsonResponse
    {
        $themes = $this->bibleService->getHealthThemes();
        return response()->json(['data' => $themes]);
    }

    /**
     * Get verses for a specific health theme.
     */
    public function getThemeVerses(Request $request, string $themeKey): JsonResponse
    {
        $bibleId = $request->get('bibleId');
        $result = $this->bibleService->getThemeVerses($themeKey, $bibleId);

        if (isset($result['error'])) {
            return response()->json(['error' => $result['error']], 404);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Get list of Bible books for browsing.
     */
    public function getBooks(): JsonResponse
    {
        $books = $this->bibleService->getBooks();
        return response()->json(['data' => $books]);
    }

    /**
     * Get a chapter from a book.
     */
    public function getChapter(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bookId' => 'required|string|max:10',
            'chapter' => 'required|integer|min:1|max:150',
            'bibleId' => 'nullable|string',
        ]);

        $result = $this->bibleService->getChapter(
            $validated['bookId'],
            $validated['chapter'],
            $validated['bibleId'] ?? null
        );

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 404);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Get available Bible translations.
     */
    public function getTranslations(): JsonResponse
    {
        $translations = $this->bibleService->getTranslations();
        return response()->json(['data' => $translations]);
    }

    /**
     * Search health-themed verses by keyword.
     */
    public function searchHealthVerses(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:100',
            'bibleId' => 'nullable|string',
        ]);

        $result = $this->bibleService->searchHealthVerses(
            $validated['query'],
            $validated['bibleId'] ?? null
        );

        if (isset($result['error'])) {
            return response()->json(['error' => $result['error']], 400);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Get the daily health verse.
     */
    public function getDailyVerse(Request $request): JsonResponse
    {
        $bibleId = $request->get('bibleId');
        $result = $this->bibleService->getDailyVerse($bibleId);

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Get available Bible versions.
     */
    public function getBibles(): JsonResponse
    {
        $result = $this->bibleService->getBibles();

        if (isset($result['error'])) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json($result);
    }
}
