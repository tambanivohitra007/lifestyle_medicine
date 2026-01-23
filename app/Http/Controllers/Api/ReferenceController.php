<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReferenceResource;
use App\Models\Reference;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ReferenceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Reference::query();

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('citation', 'like', '%' . $request->search . '%')
                  ->orWhere('doi', 'like', '%' . $request->search . '%')
                  ->orWhere('pmid', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        $references = $query->paginate(20);

        return ReferenceResource::collection($references);
    }

    public function show(Reference $reference): ReferenceResource
    {
        $reference->load(['creator', 'updater']);

        return new ReferenceResource($reference);
    }

    public function store(Request $request): ReferenceResource
    {
        $validated = $request->validate([
            'citation' => 'required|string',
            'doi' => 'nullable|string|max:255',
            'pmid' => 'nullable|string|max:255',
            'url' => 'nullable|url',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
        ]);

        $reference = Reference::create($validated);

        return new ReferenceResource($reference);
    }

    public function update(Request $request, Reference $reference): ReferenceResource
    {
        $validated = $request->validate([
            'citation' => 'sometimes|required|string',
            'doi' => 'nullable|string|max:255',
            'pmid' => 'nullable|string|max:255',
            'url' => 'nullable|url',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
        ]);

        $reference->update($validated);

        return new ReferenceResource($reference);
    }

    public function destroy(Reference $reference): Response
    {
        $reference->delete();

        return response()->noContent();
    }
}
