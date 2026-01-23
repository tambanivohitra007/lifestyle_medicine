<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScriptureResource;
use App\Models\Scripture;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ScriptureController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Scripture::with('tags');

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
                $q->where('reference', 'like', '%' . $request->search . '%')
                  ->orWhere('text', 'like', '%' . $request->search . '%')
                  ->orWhere('theme', 'like', '%' . $request->search . '%');
            });
        }

        $scriptures = $query->paginate(20);

        return ScriptureResource::collection($scriptures);
    }

    public function show(Scripture $scripture): ScriptureResource
    {
        $scripture->load(['conditions', 'interventions', 'tags']);

        return new ScriptureResource($scripture);
    }

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

        if (!empty($tagIds)) {
            $scripture->tags()->attach($tagIds);
        }

        return new ScriptureResource($scripture->load('tags'));
    }

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

    public function destroy(Scripture $scripture): Response
    {
        $scripture->delete();

        return response()->noContent();
    }
}
