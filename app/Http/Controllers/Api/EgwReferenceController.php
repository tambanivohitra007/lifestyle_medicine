<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\HasSorting;
use App\Http\Resources\EgwReferenceResource;
use App\Models\EgwReference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Manages Ellen G. White (EGW) reference quotes for spiritual health guidance.
 *
 * Provides CRUD operations for EGW references with book/topic filtering,
 * content tag management, and publishing workflow. References include
 * book, chapter, page range, and contextual quote data.
 *
 * Routes: /api/v1/egw-references (public), /api/v1/admin/egw-references (admin)
 */
class EgwReferenceController extends Controller
{
    use HasSorting;

    /**
     * List all EGW references with optional filtering, search, and sorting.
     *
     * Admin/editor users can filter by publishing status; public users see only published.
     * Supports filtering by book, topic, tag_id, and search across book/quote/topic/context.
     *
     * GET /api/v1/egw-references
     *
     * @param  Request  $request  Query params: status, search, book, topic, tag_id, sort_by, sort_order
     * @return AnonymousResourceCollection Paginated collection of EgwReferenceResource (20 per page)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = EgwReference::with('tags');

        // Publishing status filtering
        $user = auth('sanctum')->user();
        if ($user && in_array($user->role, ['admin', 'editor'])) {
            if ($request->has('status')) {
                $query->withStatus($request->status);
            }
        } else {
            $query->published();
        }

        // Search across book, quote, topic
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('book', 'like', '%'.$request->search.'%')
                    ->orWhere('quote', 'like', '%'.$request->search.'%')
                    ->orWhere('topic', 'like', '%'.$request->search.'%')
                    ->orWhere('context', 'like', '%'.$request->search.'%');
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

    /**
     * Display a single EGW reference with its related data.
     *
     * GET /api/v1/egw-references/{egwReference}
     *
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return EgwReferenceResource
     */
    public function show(EgwReference $egwReference): EgwReferenceResource
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $egwReference->isPublished()) {
            abort(404);
        }

        $egwReference->load(['conditions', 'interventions', 'tags', 'creator', 'updater']);

        return new EgwReferenceResource($egwReference);
    }

    /**
     * Publish an EGW reference.
     *
     * POST /api/v1/admin/egw-references/{egwReference}/publish (admin only)
     *
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return JsonResponse Success message
     */
    public function publish(EgwReference $egwReference): JsonResponse
    {
        $egwReference->publish();

        return response()->json(['message' => 'EGW reference published successfully']);
    }

    /**
     * Submit an EGW reference for editorial review.
     *
     * POST /api/v1/admin/egw-references/{egwReference}/submit-for-review
     *
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return JsonResponse Success message
     */
    public function submitForReview(EgwReference $egwReference): JsonResponse
    {
        $egwReference->submitForReview();

        return response()->json(['message' => 'EGW reference submitted for review']);
    }

    /**
     * Archive an EGW reference.
     *
     * POST /api/v1/admin/egw-references/{egwReference}/archive (admin only)
     *
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return JsonResponse Success message
     */
    public function archive(EgwReference $egwReference): JsonResponse
    {
        $egwReference->archive();

        return response()->json(['message' => 'EGW reference archived successfully']);
    }

    /**
     * Return an EGW reference to draft status.
     *
     * POST /api/v1/admin/egw-references/{egwReference}/return-to-draft
     *
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return JsonResponse Success message
     */
    public function returnToDraft(EgwReference $egwReference): JsonResponse
    {
        $egwReference->returnToDraft();

        return response()->json(['message' => 'EGW reference returned to draft']);
    }

    /**
     * Create a new EGW reference.
     *
     * POST /api/v1/admin/egw-references
     *
     * @param  Request  $request  Validated fields: book, book_abbreviation, chapter, page_start, page_end, paragraph, quote, topic, context, tag_ids
     * @return EgwReferenceResource The newly created EGW reference
     */
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

        if (! empty($tagIds)) {
            $egwReference->tags()->attach($tagIds);
        }

        return new EgwReferenceResource($egwReference->load('tags'));
    }

    /**
     * Update an existing EGW reference.
     *
     * PUT /api/v1/admin/egw-references/{egwReference}
     *
     * @param  Request       $request       Validated fields: book, book_abbreviation, chapter, page range, quote, topic, context, tag_ids
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return EgwReferenceResource The updated EGW reference
     */
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

    /**
     * Soft-delete an EGW reference.
     *
     * DELETE /api/v1/admin/egw-references/{egwReference}
     *
     * @param  EgwReference  $egwReference  Route-model bound EGW reference instance
     * @return Response 204 No Content
     */
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
