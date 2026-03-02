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

class ContentRevisionController extends Controller
{
    private array $modelMap = [
        'conditions' => Condition::class,
        'interventions' => Intervention::class,
        'recipes' => Recipe::class,
        'scriptures' => Scripture::class,
        'egw-references' => EgwReference::class,
    ];

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

    public function show(ContentRevision $revision): ContentRevisionResource
    {
        $revision->load('creator');

        return new ContentRevisionResource($revision);
    }

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

    private function getModelClass(string $type): string
    {
        if (! isset($this->modelMap[$type])) {
            abort(404, 'Unknown content type: '.$type);
        }

        return $this->modelMap[$type];
    }

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
