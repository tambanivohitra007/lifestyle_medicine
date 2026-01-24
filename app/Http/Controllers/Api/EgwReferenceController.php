<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\HasSorting;
use App\Http\Resources\EgwReferenceResource;
use App\Models\EgwReference;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class EgwReferenceController extends Controller
{
    use HasSorting;
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = EgwReference::with('tags');

        // Search across book, quote, topic
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('book', 'like', '%' . $request->search . '%')
                  ->orWhere('quote', 'like', '%' . $request->search . '%')
                  ->orWhere('topic', 'like', '%' . $request->search . '%')
                  ->orWhere('context', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by book
        if ($request->has('book')) {
            $query->where('book', $request->book);
        }

        // Filter by topic
        if ($request->has('topic')) {
            $query->where('topic', $request->topic);
        }

        // Filter by tag
        if ($request->has('tag_id')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('content_tags.id', $request->tag_id);
            });
        }

        // Apply sorting
        $allowedSortColumns = ['book', 'page_start', 'topic', 'created_at', 'updated_at'];
        $query = $this->applySorting($query, $request, $allowedSortColumns, 'book');

        $references = $query->paginate(20);

        return EgwReferenceResource::collection($references);
    }

    public function show(EgwReference $egwReference): EgwReferenceResource
    {
        $egwReference->load(['conditions', 'interventions', 'tags', 'creator', 'updater']);

        return new EgwReferenceResource($egwReference);
    }

    public function store(Request $request): EgwReferenceResource
    {
        $validated = $request->validate([
            'book' => 'required|string|max:255',
            'book_abbreviation' => 'nullable|string|max:20',
            'chapter' => 'nullable|string|max:255',
            'page_start' => 'nullable|integer|min:1',
            'page_end' => 'nullable|integer|min:1|gte:page_start',
            'paragraph' => 'nullable|string|max:20',
            'quote' => 'required|string',
            'topic' => 'nullable|string|max:255',
            'context' => 'nullable|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        $egwReference = EgwReference::create($validated);

        if (!empty($tagIds)) {
            $egwReference->tags()->attach($tagIds);
        }

        return new EgwReferenceResource($egwReference->load('tags'));
    }

    public function update(Request $request, EgwReference $egwReference): EgwReferenceResource
    {
        $validated = $request->validate([
            'book' => 'sometimes|required|string|max:255',
            'book_abbreviation' => 'nullable|string|max:20',
            'chapter' => 'nullable|string|max:255',
            'page_start' => 'nullable|integer|min:1',
            'page_end' => 'nullable|integer|min:1|gte:page_start',
            'paragraph' => 'nullable|string|max:20',
            'quote' => 'sometimes|required|string',
            'topic' => 'nullable|string|max:255',
            'context' => 'nullable|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        $egwReference->update($validated);

        if ($tagIds !== null) {
            $egwReference->tags()->sync($tagIds);
        }

        return new EgwReferenceResource($egwReference->load('tags'));
    }

    public function destroy(EgwReference $egwReference): Response
    {
        $egwReference->delete();

        return response()->noContent();
    }

    /**
     * Get list of unique books for filtering.
     */
    public function books(): \Illuminate\Http\JsonResponse
    {
        $books = EgwReference::distinct()
            ->orderBy('book')
            ->pluck('book');

        return response()->json(['data' => $books]);
    }

    /**
     * Get list of unique topics for filtering.
     */
    public function topics(): \Illuminate\Http\JsonResponse
    {
        $topics = EgwReference::whereNotNull('topic')
            ->distinct()
            ->orderBy('topic')
            ->pluck('topic');

        return response()->json(['data' => $topics]);
    }

    /**
     * Get book abbreviations reference.
     */
    public function abbreviations(): \Illuminate\Http\JsonResponse
    {
        return response()->json(['data' => EgwReference::getBookAbbreviations()]);
    }
}
