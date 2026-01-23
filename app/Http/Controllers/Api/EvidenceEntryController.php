<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EvidenceEntryResource;
use App\Models\EvidenceEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class EvidenceEntryController extends Controller
{
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

    public function show(EvidenceEntry $evidenceEntry): EvidenceEntryResource
    {
        $evidenceEntry->load(['intervention', 'references', 'creator', 'updater']);

        return new EvidenceEntryResource($evidenceEntry);
    }

    public function store(Request $request): EvidenceEntryResource
    {
        $validated = $request->validate([
            'intervention_id' => 'required|exists:interventions,id',
            'study_type' => 'required|in:rct,meta_analysis,systematic_review,observational,case_series,expert_opinion',
            'population' => 'nullable|string|max:255',
            'quality_rating' => 'nullable|in:A,B,C,D',
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

    public function update(Request $request, EvidenceEntry $evidenceEntry): EvidenceEntryResource
    {
        $validated = $request->validate([
            'intervention_id' => 'sometimes|required|exists:interventions,id',
            'study_type' => 'sometimes|required|in:rct,meta_analysis,systematic_review,observational,case_series,expert_opinion',
            'population' => 'nullable|string|max:255',
            'quality_rating' => 'nullable|in:A,B,C,D',
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

    public function destroy(EvidenceEntry $evidenceEntry): Response
    {
        $evidenceEntry->delete();

        return response()->noContent();
    }
}
