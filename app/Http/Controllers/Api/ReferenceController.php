<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReferenceResource;
use App\Models\Reference;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Manages scientific/academic references (citations, DOIs, PMIDs).
 *
 * Provides CRUD operations for references that support evidence entries.
 * References can be linked to evidence entries via a many-to-many relationship.
 *
 * Routes: /api/v1/references (public read), /api/v1/admin/references (admin CRUD)
 */
class ReferenceController extends Controller
{
    /**
     * List all references with optional search and year filtering.
     *
     * GET /api/v1/references
     *
     * @param  Request  $request  Query params: search (citation/doi/pmid), year
     * @return AnonymousResourceCollection Paginated collection of ReferenceResource (20 per page)
     */
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

    /**
     * Display a single reference with audit information.
     *
     * GET /api/v1/references/{reference}
     *
     * @param  Reference  $reference  Route-model bound reference instance
     * @return ReferenceResource
     */
    public function show(Reference $reference): ReferenceResource
    {
        $reference->load(['creator', 'updater']);

        return new ReferenceResource($reference);
    }

    /**
     * Create a new reference.
     *
     * POST /api/v1/admin/references
     *
     * @param  Request  $request  Validated fields: citation, doi, pmid, url, year
     * @return ReferenceResource The newly created reference
     */
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

    /**
     * Update an existing reference.
     *
     * PUT /api/v1/admin/references/{reference}
     *
     * @param  Request    $request    Validated fields: citation, doi, pmid, url, year
     * @param  Reference  $reference  Route-model bound reference instance
     * @return ReferenceResource The updated reference
     */
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

    /**
     * Soft-delete a reference.
     *
     * DELETE /api/v1/admin/references/{reference}
     *
     * @param  Reference  $reference  Route-model bound reference instance
     * @return Response 204 No Content
     */
    public function destroy(Reference $reference): Response
    {
        $reference->delete();

        return response()->noContent();
    }
}
