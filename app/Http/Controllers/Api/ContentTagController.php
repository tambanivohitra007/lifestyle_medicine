<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentTagResource;
use App\Models\ContentTag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ContentTagController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ContentTag::query();

        if ($request->has('search')) {
            $query->where('tag', 'like', '%' . $request->search . '%');
        }

        $tags = $query->paginate(50);

        return ContentTagResource::collection($tags);
    }

    public function show(ContentTag $contentTag): ContentTagResource
    {
        $contentTag->load(['interventions', 'recipes', 'scriptures']);

        return new ContentTagResource($contentTag);
    }

    public function store(Request $request): ContentTagResource
    {
        $validated = $request->validate([
            'tag' => 'required|string|max:255|unique:content_tags,tag',
        ]);

        $tag = ContentTag::create($validated);

        return new ContentTagResource($tag);
    }

    public function update(Request $request, ContentTag $contentTag): ContentTagResource
    {
        $validated = $request->validate([
            'tag' => 'required|string|max:255|unique:content_tags,tag,' . $contentTag->id,
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
