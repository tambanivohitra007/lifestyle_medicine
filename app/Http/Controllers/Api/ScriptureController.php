<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\HasSorting;
use App\Http\Resources\ScriptureResource;
use App\Models\Scripture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Manages Bible scripture references linked to health conditions.
 *
 * Provides CRUD operations for scriptures with theme-based organization,
 * content tag management, and publishing workflow support.
 *
 * Routes: /api/v1/scriptures (public), /api/v1/admin/scriptures (admin)
 */
class ScriptureController extends Controller
{
    use HasSorting;

    /**
     * Get a list of unique scripture themes for filtering.
     *
     * GET /api/v1/scriptures/themes
     *
     * @return JsonResponse Array of distinct theme strings
     */
    public function themes(): JsonResponse
    {
        $themes = Scripture::whereNotNull('theme')
            ->where('theme', '!=', '')
            ->distinct()
            ->orderBy('theme')
            ->pluck('theme');

        return response()->json(['data' => $themes]);
    }

    /**
     * List all scriptures with optional filtering, search, and sorting.
     *
     * Admin/editor users can filter by publishing status; public users see only published.
     * Supports theme filtering, tag_id filtering, and search by reference/text/theme.
     *
     * GET /api/v1/scriptures
     *
     * @param  Request  $request  Query params: status, theme, tag_id, search, sort_by, sort_order
     * @return AnonymousResourceCollection Paginated collection of ScriptureResource (20 per page)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Scripture::with('tags');

        // Publishing status filtering
        $user = auth('sanctum')->user();
        if ($user && in_array($user->role, ['admin', 'editor'])) {
            if ($request->has('status')) {
                $query->withStatus($request->status);
            }
        } else {
            $query->published();
        }

        if ($request->has('theme')) {
            $query->where('theme', $request->theme);
        }

        if ($request->has('tag_id')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('content_tags.id', $request->tag_id);
            });
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('reference', 'like', '%'.$request->search.'%')
                    ->orWhere('text', 'like', '%'.$request->search.'%')
                    ->orWhere('theme', 'like', '%'.$request->search.'%');
            });
        }

        // Apply sorting
        $allowedSortColumns = ['reference', 'theme', 'created_at', 'updated_at'];
        $query = $this->applySorting($query, $request, $allowedSortColumns);

        $scriptures = $query->paginate(20);

        return ScriptureResource::collection($scriptures);
    }

    /**
     * Display a single scripture with its related data.
     *
     * GET /api/v1/scriptures/{scripture}
     *
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return ScriptureResource
     */
    public function show(Scripture $scripture): ScriptureResource
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $scripture->isPublished()) {
            abort(404);
        }

        $scripture->load(['conditions', 'interventions', 'tags', 'creator', 'updater']);

        return new ScriptureResource($scripture);
    }

    /**
     * Publish a scripture.
     *
     * POST /api/v1/admin/scriptures/{scripture}/publish (admin only)
     *
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return JsonResponse Success message
     */
    public function publish(Scripture $scripture): JsonResponse
    {
        $scripture->publish();

        return response()->json(['message' => 'Scripture published successfully']);
    }

    /**
     * Submit a scripture for editorial review.
     *
     * POST /api/v1/admin/scriptures/{scripture}/submit-for-review
     *
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return JsonResponse Success message
     */
    public function submitForReview(Scripture $scripture): JsonResponse
    {
        $scripture->submitForReview();

        return response()->json(['message' => 'Scripture submitted for review']);
    }

    /**
     * Archive a scripture.
     *
     * POST /api/v1/admin/scriptures/{scripture}/archive (admin only)
     *
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return JsonResponse Success message
     */
    public function archive(Scripture $scripture): JsonResponse
    {
        $scripture->archive();

        return response()->json(['message' => 'Scripture archived successfully']);
    }

    /**
     * Return a scripture to draft status.
     *
     * POST /api/v1/admin/scriptures/{scripture}/return-to-draft
     *
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return JsonResponse Success message
     */
    public function returnToDraft(Scripture $scripture): JsonResponse
    {
        $scripture->returnToDraft();

        return response()->json(['message' => 'Scripture returned to draft']);
    }

    /**
     * Create a new scripture.
     *
     * POST /api/v1/admin/scriptures
     *
     * @param  Request  $request  Validated fields: reference, text, theme, tag_ids
     * @return ScriptureResource The newly created scripture
     */
    public function store(Request $request): ScriptureResource
    {
        $validated = $request->validate([
            'reference' => 'required|string|max:255',
            'text' => 'required|string',
            'theme' => 'nullable|string|max:255',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        $scripture = Scripture::create($validated);

        if (! empty($tagIds)) {
            $scripture->tags()->attach($tagIds);
        }

        return new ScriptureResource($scripture->load('tags'));
    }

    /**
     * Update an existing scripture.
     *
     * PUT /api/v1/admin/scriptures/{scripture}
     *
     * @param  Request    $request    Validated fields: reference, text, theme, tag_ids
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return ScriptureResource The updated scripture
     */
    public function update(Request $request, Scripture $scripture): ScriptureResource
    {
        $validated = $request->validate([
            'reference' => 'sometimes|required|string|max:255',
            'text' => 'sometimes|required|string',
            'theme' => 'nullable|string|max:255',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        $scripture->update($validated);

        if ($tagIds !== null) {
            $scripture->tags()->sync($tagIds);
        }

        return new ScriptureResource($scripture->load('tags'));
    }

    /**
     * Soft-delete a scripture.
     *
     * DELETE /api/v1/admin/scriptures/{scripture}
     *
     * @param  Scripture  $scripture  Route-model bound scripture instance
     * @return Response 204 No Content
     */
    public function destroy(Scripture $scripture): Response
    {
        $scripture->delete();

        return response()->noContent();
    }
}
