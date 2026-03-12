<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EvidenceEntryResource;
use App\Models\EvidenceEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Manages evidence entries (clinical studies/research) supporting interventions.
 *
 * Each evidence entry belongs to an intervention and can reference multiple
 * academic references. Supports filtering by intervention, study type,
 * and quality rating.
 *
 * Routes: /api/v1/evidence-entries (public read), /api/v1/admin/evidence-entries (admin CRUD)
 */
class EvidenceEntryController extends Controller
{
    /**
     * List all evidence entries with optional filtering and search.
     *
     * Supports filtering by intervention_id, study_type, quality_rating,
     * and search across summary, population, notes, and intervention name.
     *
     * GET /api/v1/evidence-entries
     *
     * @param  Request  $request  Query params: search, intervention_id, study_type, quality_rating
     * @return AnonymousResourceCollection Paginated collection of EvidenceEntryResource (20 per page)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = EvidenceEntry::with(['intervention', 'references']);

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('summary', 'like', '%' . $request->search . '%')
                  ->orWhere('population', 'like', '%' . $request->search . '%')
                  ->orWhere('notes', 'like', '%' . $request->search . '%')
                  ->orWhereHas('intervention', function ($q) use ($request) {
                      $q->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('intervention_id')) {
            $query->where('intervention_id', $request->intervention_id);
        }

        if ($request->has('study_type')) {
            $query->where('study_type', $request->study_type);
        }

        if ($request->has('quality_rating')) {
            $query->where('quality_rating', $request->quality_rating);
        }

        $evidence = $query->paginate(20);

        return EvidenceEntryResource::collection($evidence);
    }

    /**
     * Display a single evidence entry with its intervention, references, and audit info.
     *
     * GET /api/v1/evidence-entries/{evidenceEntry}
     *
     * @param  EvidenceEntry  $evidenceEntry  Route-model bound evidence entry instance
     * @return EvidenceEntryResource
     */
    public function show(EvidenceEntry $evidenceEntry): EvidenceEntryResource
    {
        $evidenceEntry->load(['intervention', 'references', 'creator', 'updater']);

        return new EvidenceEntryResource($evidenceEntry);
    }

    /**
     * Create a new evidence entry with optional reference attachments.
     *
     * POST /api/v1/admin/evidence-entries
     *
     * @param  Request  $request  Validated fields: intervention_id, study_type, population, sample_size, quality_rating, recommendation_strength, summary, notes, reference_ids
     * @return EvidenceEntryResource The newly created evidence entry
     */
    public function store(Request $request): EvidenceEntryResource
    {
        $validated = $request->validate([
            'intervention_id' => 'required|exists:interventions,id',
            'study_type' => 'required|in:meta_analysis,systematic_review,rct,cohort,case_control,cross_sectional,case_series,case_report,observational,expert_opinion',
            'population' => 'nullable|string|max:255',
            'sample_size' => 'nullable|integer|min:1',
            'quality_rating' => 'nullable|in:A,B,C,D',
            'recommendation_strength' => 'nullable|in:strong,weak',
            'summary' => 'required|string',
            'notes' => 'nullable|string',
            'reference_ids' => 'nullable|array',
            'reference_ids.*' => 'exists:references,id',
        ]);

        $referenceIds = $validated['reference_ids'] ?? [];
        unset($validated['reference_ids']);

        $evidenceEntry = EvidenceEntry::create($validated);

        if (!empty($referenceIds)) {
            $evidenceEntry->references()->attach($referenceIds);
        }

        return new EvidenceEntryResource($evidenceEntry->load('references'));
    }

    /**
     * Update an existing evidence entry.
     *
     * PUT /api/v1/admin/evidence-entries/{evidenceEntry}
     *
     * @param  Request        $request        Validated fields: intervention_id, study_type, population, sample_size, quality_rating, recommendation_strength, summary, notes, reference_ids
     * @param  EvidenceEntry  $evidenceEntry  Route-model bound evidence entry instance
     * @return EvidenceEntryResource The updated evidence entry
     */
    public function update(Request $request, EvidenceEntry $evidenceEntry): EvidenceEntryResource
    {
        $validated = $request->validate([
            'intervention_id' => 'sometimes|required|exists:interventions,id',
            'study_type' => 'sometimes|required|in:meta_analysis,systematic_review,rct,cohort,case_control,cross_sectional,case_series,case_report,observational,expert_opinion',
            'population' => 'nullable|string|max:255',
            'sample_size' => 'nullable|integer|min:1',
            'quality_rating' => 'nullable|in:A,B,C,D',
            'recommendation_strength' => 'nullable|in:strong,weak',
            'summary' => 'sometimes|required|string',
            'notes' => 'nullable|string',
            'reference_ids' => 'nullable|array',
            'reference_ids.*' => 'exists:references,id',
        ]);

        $referenceIds = $validated['reference_ids'] ?? null;
        unset($validated['reference_ids']);

        $evidenceEntry->update($validated);

        if ($referenceIds !== null) {
            $evidenceEntry->references()->sync($referenceIds);
        }

        return new EvidenceEntryResource($evidenceEntry->load('references'));
    }

    /**
     * Soft-delete an evidence entry.
     *
     * DELETE /api/v1/admin/evidence-entries/{evidenceEntry}
     *
     * @param  EvidenceEntry  $evidenceEntry  Route-model bound evidence entry instance
     * @return Response 204 No Content
     */
    public function destroy(EvidenceEntry $evidenceEntry): Response
    {
        $evidenceEntry->delete();

        return response()->noContent();
    }
}
