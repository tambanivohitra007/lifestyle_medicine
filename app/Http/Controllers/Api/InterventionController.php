<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\HasSorting;
use App\Http\Resources\ConditionResource;
use App\Http\Resources\EvidenceEntryResource;
use App\Http\Resources\InterventionResource;
use App\Models\Intervention;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class InterventionController extends Controller
{
    use HasSorting;

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Intervention::with(['careDomain', 'tags']);

        // Publishing status filtering
        $user = auth('sanctum')->user();
        if ($user && in_array($user->role, ['admin', 'editor'])) {
            if ($request->has('status')) {
                $query->withStatus($request->status);
            }
        } else {
            $query->published();
        }

        if ($request->has('care_domain_id')) {
            $query->where('care_domain_id', $request->care_domain_id);
        }

        if ($request->has('tag_id')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('content_tags.id', $request->tag_id);
            });
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        // Apply sorting
        $allowedSortColumns = ['name', 'care_domain_id', 'created_at', 'updated_at'];
        $query = $this->applySorting($query, $request, $allowedSortColumns);

        $interventions = $query->paginate(20);

        return InterventionResource::collection($interventions);
    }

    public function show(Intervention $intervention): InterventionResource
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $intervention->isPublished()) {
            abort(404);
        }

        $intervention->load(['careDomain', 'evidenceEntries.references', 'tags', 'media', 'creator', 'updater']);

        return new InterventionResource($intervention);
    }

    public function publish(Intervention $intervention): JsonResponse
    {
        $intervention->publish();

        return response()->json(['message' => 'Intervention published successfully']);
    }

    public function submitForReview(Intervention $intervention): JsonResponse
    {
        $intervention->submitForReview();

        return response()->json(['message' => 'Intervention submitted for review']);
    }

    public function archive(Intervention $intervention): JsonResponse
    {
        $intervention->archive();

        return response()->json(['message' => 'Intervention archived successfully']);
    }

    public function returnToDraft(Intervention $intervention): JsonResponse
    {
        $intervention->returnToDraft();

        return response()->json(['message' => 'Intervention returned to draft']);
    }

    public function store(Request $request): InterventionResource
    {
        $validated = $request->validate([
            'care_domain_id' => 'required|exists:care_domains,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'mechanism' => 'nullable|string',
            'snomed_code' => 'nullable|string|max:20',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        $intervention = Intervention::create($validated);

        if (! empty($tagIds)) {
            $intervention->tags()->attach($tagIds);
        }

        return new InterventionResource($intervention->load(['careDomain', 'tags']));
    }

    public function update(Request $request, Intervention $intervention): InterventionResource
    {
        $validated = $request->validate([
            'care_domain_id' => 'sometimes|required|exists:care_domains,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'mechanism' => 'nullable|string',
            'snomed_code' => 'nullable|string|max:20',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:content_tags,id',
        ]);

        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        $intervention->update($validated);

        if ($tagIds !== null) {
            $intervention->tags()->sync($tagIds);
        }

        return new InterventionResource($intervention->load(['careDomain', 'tags']));
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
