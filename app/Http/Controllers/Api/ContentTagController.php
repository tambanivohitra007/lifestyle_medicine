<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentTagResource;
use App\Models\ContentTag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ContentTagController extends Controller
{
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

    public function show(ContentTag $contentTag): ContentTagResource
    {
        $contentTag->loadCount(['interventions', 'recipes', 'scriptures', 'egwReferences']);
        $contentTag->load(['interventions', 'recipes', 'scriptures', 'egwReferences']);

        return new ContentTagResource($contentTag);
    }

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

    public function destroy(ContentTag $contentTag): Response
    {
        $contentTag->delete();

        return response()->noContent();
    }
}
