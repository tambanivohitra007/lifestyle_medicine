<?php

namespace App\Models\Traits;

use App\Models\ContentRevision;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

trait HasRevisions
{
    protected static function bootHasRevisions(): void
    {
        static::updating(function ($model) {
            $model->createRevision();
        });
    }

    public function revisions(): MorphMany
    {
        return $this->morphMany(ContentRevision::class, 'revisionable')
            ->orderBy('version_number', 'desc');
    }

    public function createRevision(?string $changeSummary = null): ContentRevision
    {
        $revision = ContentRevision::create([
            'revisionable_type' => get_class($this),
            'revisionable_id' => $this->id,
            'version_number' => ContentRevision::getNextVersionNumber(get_class($this), $this->id),
            'data' => $this->getOriginal(),
            'change_summary' => $changeSummary,
            'created_by' => Auth::id(),
            'created_at' => now(),
        ]);

        $this->pruneOldRevisions();

        return $revision;
    }

    public function restoreRevision(ContentRevision $revision): self
    {
        $data = $revision->data;

        // Remove non-fillable keys from revision data
        $fillable = $this->getFillable();
        $restoreData = array_intersect_key($data, array_flip($fillable));

        $this->fill($restoreData);
        $this->save();

        return $this;
    }

    public function latestRevision(): ?ContentRevision
    {
        return $this->revisions()->first();
    }

    public function pruneOldRevisions(int $keep = 50): void
    {
        $keepIds = $this->revisions()
            ->orderBy('version_number', 'desc')
            ->take($keep)
            ->pluck('id');

        ContentRevision::where('revisionable_type', get_class($this))
            ->where('revisionable_id', $this->id)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }
}
