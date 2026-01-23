<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConditionResource;
use App\Http\Resources\EvidenceEntryResource;
use App\Http\Resources\InterventionResource;
use App\Models\Intervention;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class InterventionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Intervention::with('careDomain');

        if ($request->has('care_domain_id')) {
            $query->where('care_domain_id', $request->care_domain_id);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $interventions = $query->paginate(20);

        return InterventionResource::collection($interventions);
    }

    public function show(Intervention $intervention): InterventionResource
    {
        $intervention->load(['careDomain', 'evidenceEntries.references', 'tags']);

        return new InterventionResource($intervention);
    }

    public function store(Request $request): InterventionResource
    {
        $validated = $request->validate([
            'care_domain_id' => 'required|exists:care_domains,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'mechanism' => 'nullable|string',
        ]);

        $intervention = Intervention::create($validated);

        return new InterventionResource($intervention);
    }

    public function update(Request $request, Intervention $intervention): InterventionResource
    {
        $validated = $request->validate([
            'care_domain_id' => 'sometimes|required|exists:care_domains,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'mechanism' => 'nullable|string',
        ]);

        $intervention->update($validated);

        return new InterventionResource($intervention);
    }

    public function destroy(Intervention $intervention): Response
    {
        $intervention->delete();

        return response()->noContent();
    }

    public function evidence(Intervention $intervention): AnonymousResourceCollection
    {
        $evidence = $intervention->evidenceEntries()->with('references')->get();

        return EvidenceEntryResource::collection($evidence);
    }

    public function conditions(Intervention $intervention): AnonymousResourceCollection
    {
        $conditions = $intervention->conditions()
            ->withPivot(['strength_of_evidence', 'recommendation_level', 'clinical_notes'])
            ->get();

        return ConditionResource::collection($conditions);
    }
}
