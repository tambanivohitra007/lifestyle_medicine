<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentRevisionResource;
use App\Models\Condition;
use App\Models\ContentRevision;
use App\Models\EgwReference;
use App\Models\Intervention;
use App\Models\Recipe;
use App\Models\Scripture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Manages content revision history for versioned entities.
 *
 * Provides version listing, detail viewing, restoration to previous versions,
 * and diff comparison between two revisions. Supports conditions, interventions,
 * recipes, scriptures, and EGW references.
 *
 * Routes: /api/v1/admin/revisions/* (admin/editor)
 */
class ContentRevisionController extends Controller
{
    private array $modelMap = [
        'conditions' => Condition::class,
        'interventions' => Intervention::class,
        'recipes' => Recipe::class,
        'scriptures' => Scripture::class,
        'egw-references' => EgwReference::class,
    ];

    /**
     * List all revisions for a specific entity, newest first.
     *
     * GET /api/v1/admin/revisions/{type}/{id}
     *
     * @param  string  $type  Entity type slug: conditions, interventions, recipes, scriptures, egw-references
     * @param  string  $id    Entity UUID
     * @return AnonymousResourceCollection Paginated collection of ContentRevisionResource
     */
    public function index(string $type, string $id): AnonymousResourceCollection
    {
        $modelClass = $this->getModelClass($type);

        $revisions = ContentRevision::where('revisionable_type', $modelClass)
            ->where('revisionable_id', $id)
            ->with('creator')
            ->orderBy('version_number', 'desc')
            ->paginate(20);

        return ContentRevisionResource::collection($revisions);
    }

    /**
     * Display a single revision with its full data snapshot.
     *
     * GET /api/v1/admin/revisions/detail/{revision}
     *
     * @param  ContentRevision  $revision  Route-model bound revision instance
     * @return ContentRevisionResource
     */
    public function show(ContentRevision $revision): ContentRevisionResource
    {
        $revision->load('creator');

        return new ContentRevisionResource($revision);
    }

    /**
     * Restore an entity to a previous revision's state.
     *
     * POST /api/v1/admin/revisions/{type}/{id}/restore/{revision}
     *
     * @param  string           $type      Entity type slug
     * @param  string           $id        Entity UUID
     * @param  ContentRevision  $revision  The revision to restore to
     * @return JsonResponse Success message with version number
     */
    public function restore(string $type, string $id, ContentRevision $revision): JsonResponse
    {
        $modelClass = $this->getModelClass($type);
        $model = $modelClass::findOrFail($id);

        // Verify the revision belongs to this model
        if ($revision->revisionable_type !== $modelClass || $revision->revisionable_id !== $id) {
            abort(422, 'Revision does not belong to this entity');
        }

        $model->restoreRevision($revision);

        return response()->json(['message' => 'Restored to version '.$revision->version_number]);
    }

    /**
     * Compare two revisions of the same entity and return a field-by-field diff.
     *
     * GET /api/v1/admin/revisions/compare/{revisionA}/{revisionB}
     *
     * @param  ContentRevision  $revisionA  First revision to compare
     * @param  ContentRevision  $revisionB  Second revision to compare
     * @return JsonResponse Diff showing changed fields with old/new values
     */
    public function compare(ContentRevision $revisionA, ContentRevision $revisionB): JsonResponse
    {
        // Ensure both revisions are for the same entity
        if ($revisionA->revisionable_type !== $revisionB->revisionable_type ||
            $revisionA->revisionable_id !== $revisionB->revisionable_id) {
            abort(422, 'Cannot compare revisions from different entities');
        }

        $diff = $this->computeDiff($revisionA->data, $revisionB->data);

        return response()->json([
            'data' => [
                'revision_a' => [
                    'id' => $revisionA->id,
                    'version_number' => $revisionA->version_number,
                    'created_at' => $revisionA->created_at,
                ],
                'revision_b' => [
                    'id' => $revisionB->id,
                    'version_number' => $revisionB->version_number,
                    'created_at' => $revisionB->created_at,
                ],
                'changes' => $diff,
            ],
        ]);
    }

    /**
     * Resolve entity type slug to its Eloquent model class.
     *
     * @param  string  $type  Entity type slug (conditions, interventions, etc.)
     * @return string Fully qualified model class name
     *
     * @throws \Symfony\Component\HttpKernel\Exception\NotFoundHttpException If type is unknown
     */
    private function getModelClass(string $type): string
    {
        if (! isset($this->modelMap[$type])) {
            abort(404, 'Unknown content type: '.$type);
        }

        return $this->modelMap[$type];
    }

    /**
     * Compute a field-by-field diff between two revision data snapshots.
     *
     * Skips internal fields (id, timestamps, audit columns) and returns
     * only fields where values differ.
     *
     * @param  array  $dataA  Data snapshot from revision A
     * @param  array  $dataB  Data snapshot from revision B
     * @return array Associative array of changed fields with 'old' and 'new' values
     */
    private function computeDiff(array $dataA, array $dataB): array
    {
        $changes = [];
        $allKeys = array_unique(array_merge(array_keys($dataA), array_keys($dataB)));

        // Skip internal fields
        $skipFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by'];

        foreach ($allKeys as $key) {
            if (in_array($key, $skipFields)) {
                continue;
            }

            $valueA = $dataA[$key] ?? null;
            $valueB = $dataB[$key] ?? null;

            if ($valueA !== $valueB) {
                $changes[$key] = [
                    'old' => $valueA,
                    'new' => $valueB,
                ];
            }
        }

        return $changes;
    }
}
