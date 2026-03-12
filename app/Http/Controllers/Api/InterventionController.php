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

/**
 * Manages lifestyle medicine interventions (treatments/therapies).
 *
 * Provides CRUD operations for interventions with care domain categorization,
 * tag management, evidence entries, and publishing workflow. Each intervention
 * belongs to a NEWSTART+ care domain.
 *
 * Routes: /api/v1/interventions (public), /api/v1/admin/interventions (admin)
 */
class InterventionController extends Controller
{
    use HasSorting;

    /**
     * List all interventions with optional filtering, search, and sorting.
     *
     * Admin/editor users can filter by publishing status; public users see only published.
     * Supports filtering by care_domain_id, tag_id, and search by name/description.
     *
     * GET /api/v1/interventions
     *
     * @param  Request  $request  Query params: status, care_domain_id, tag_id, search, sort_by, sort_order
     * @return AnonymousResourceCollection Paginated collection of InterventionResource (20 per page)
     */
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

    /**
     * Display a single intervention with its related data.
     *
     * Non-admin/editor users cannot view unpublished interventions (returns 404).
     *
     * GET /api/v1/interventions/{intervention}
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return InterventionResource
     */
    public function show(Intervention $intervention): InterventionResource
    {
        $user = auth('sanctum')->user();
        if (! ($user && in_array($user->role, ['admin', 'editor'])) && ! $intervention->isPublished()) {
            abort(404);
        }

        $intervention->load(['careDomain', 'evidenceEntries.references', 'tags', 'media', 'creator', 'updater']);

        return new InterventionResource($intervention);
    }

    /**
     * Publish an intervention.
     *
     * POST /api/v1/admin/interventions/{intervention}/publish (admin only)
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return JsonResponse Success message
     */
    public function publish(Intervention $intervention): JsonResponse
    {
        $intervention->publish();

        return response()->json(['message' => 'Intervention published successfully']);
    }

    /**
     * Submit an intervention for editorial review.
     *
     * POST /api/v1/admin/interventions/{intervention}/submit-for-review
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return JsonResponse Success message
     */
    public function submitForReview(Intervention $intervention): JsonResponse
    {
        $intervention->submitForReview();

        return response()->json(['message' => 'Intervention submitted for review']);
    }

    /**
     * Archive an intervention.
     *
     * POST /api/v1/admin/interventions/{intervention}/archive (admin only)
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return JsonResponse Success message
     */
    public function archive(Intervention $intervention): JsonResponse
    {
        $intervention->archive();

        return response()->json(['message' => 'Intervention archived successfully']);
    }

    /**
     * Return an intervention to draft status.
     *
     * POST /api/v1/admin/interventions/{intervention}/return-to-draft
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return JsonResponse Success message
     */
    public function returnToDraft(Intervention $intervention): JsonResponse
    {
        $intervention->returnToDraft();

        return response()->json(['message' => 'Intervention returned to draft']);
    }

    /**
     * Create a new intervention.
     *
     * POST /api/v1/admin/interventions
     *
     * @param  Request  $request  Validated fields: care_domain_id, name, description, mechanism, snomed_code, tag_ids
     * @return InterventionResource The newly created intervention
     */
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

    /**
     * Update an existing intervention.
     *
     * PUT /api/v1/admin/interventions/{intervention}
     *
     * @param  Request       $request       Validated fields: care_domain_id, name, description, mechanism, snomed_code, tag_ids
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return InterventionResource The updated intervention
     */
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

    /**
     * Soft-delete an intervention.
     *
     * DELETE /api/v1/admin/interventions/{intervention}
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return Response 204 No Content
     */
    public function destroy(Intervention $intervention): Response
    {
        $intervention->delete();

        return response()->noContent();
    }

    /**
     * List all evidence entries for an intervention.
     *
     * GET /api/v1/interventions/{intervention}/evidence
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return AnonymousResourceCollection Collection of EvidenceEntryResource
     */
    public function evidence(Intervention $intervention): AnonymousResourceCollection
    {
        $evidence = $intervention->evidenceEntries()->with('references')->get();

        return EvidenceEntryResource::collection($evidence);
    }

    /**
     * List all conditions linked to an intervention with pivot data.
     *
     * GET /api/v1/interventions/{intervention}/conditions
     *
     * @param  Intervention  $intervention  Route-model bound intervention instance
     * @return AnonymousResourceCollection Collection of ConditionResource with pivot data
     */
    public function conditions(Intervention $intervention): AnonymousResourceCollection
    {
        $conditions = $intervention->conditions()
            ->withPivot(['strength_of_evidence', 'recommendation_level', 'clinical_notes'])
            ->get();

        return ConditionResource::collection($conditions);
    }
}
