<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentTagResource;
use App\Models\ContentTag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * Manages content tags for cross-cutting categorization of interventions, recipes, scriptures, and EGW references.
 *
 * Tags provide a flat taxonomy that spans multiple content types. Each tag
 * includes counts of associated entities when listed.
 *
 * Routes: /api/v1/content-tags (public read), /api/v1/admin/content-tags (admin CRUD)
 */
class ContentTagController extends Controller
{
    /**
     * List all content tags with usage counts, searchable and alphabetically sorted.
     *
     * GET /api/v1/content-tags
     *
     * @param  Request  $request  Query params: search
     * @return AnonymousResourceCollection Paginated collection of ContentTagResource (50 per page)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ContentTag::withCount(['interventions', 'recipes', 'scriptures', 'egwReferences']);

        if ($request->has('search')) {
            $query->where('tag', 'like', '%'.$request->search.'%');
        }

        $query->orderBy('tag');

        $tags = $query->paginate(50);

        return ContentTagResource::collection($tags);
    }

    /**
     * Display a single content tag with its related entities and usage counts.
     *
     * GET /api/v1/content-tags/{contentTag}
     *
     * @param  ContentTag  $contentTag  Route-model bound content tag instance
     * @return ContentTagResource
     */
    public function show(ContentTag $contentTag): ContentTagResource
    {
        $contentTag->loadCount(['interventions', 'recipes', 'scriptures', 'egwReferences']);
        $contentTag->load(['interventions', 'recipes', 'scriptures', 'egwReferences']);

        return new ContentTagResource($contentTag);
    }

    /**
     * Create a new content tag.
     *
     * POST /api/v1/admin/content-tags
     *
     * @param  Request  $request  Validated fields: tag (unique)
     * @return ContentTagResource The newly created content tag
     */
    public function store(Request $request): ContentTagResource
    {
        $validated = $request->validate([
            'tag' => [
                'required',
                'string',
                'max:255',
                Rule::unique('content_tags', 'tag')->whereNull('deleted_at'),
            ],
        ]);

        $tag = ContentTag::create($validated);

        return new ContentTagResource($tag);
    }

    /**
     * Update an existing content tag.
     *
     * PUT /api/v1/admin/content-tags/{contentTag}
     *
     * @param  Request     $request     Validated fields: tag (unique)
     * @param  ContentTag  $contentTag  Route-model bound content tag instance
     * @return ContentTagResource The updated content tag
     */
    public function update(Request $request, ContentTag $contentTag): ContentTagResource
    {
        $validated = $request->validate([
            'tag' => [
                'required',
                'string',
                'max:255',
                Rule::unique('content_tags', 'tag')->ignore($contentTag->id)->whereNull('deleted_at'),
            ],
        ]);

        $contentTag->update($validated);

        return new ContentTagResource($contentTag);
    }

    /**
     * Soft-delete a content tag.
     *
     * DELETE /api/v1/admin/content-tags/{contentTag}
     *
     * @param  ContentTag  $contentTag  Route-model bound content tag instance
     * @return Response 204 No Content
     */
    public function destroy(ContentTag $contentTag): Response
    {
        $contentTag->delete();

        return response()->noContent();
    }
}
