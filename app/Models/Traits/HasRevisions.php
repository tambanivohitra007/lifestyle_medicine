<?php

namespace App\Models\Traits;

use App\Models\ContentRevision;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

/**
 * Provides automatic content revision tracking for Eloquent models.
 *
 * This trait automatically creates a revision snapshot before each model update,
 * storing the original data as a versioned ContentRevision record. It supports
 * retrieving the revision history, restoring to a previous version, and pruning
 * old revisions to keep only the most recent entries (default: 50).
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentRevision> $revisions
 */
trait HasRevisions
{
    /**
     * Boot the trait.
     *
     * Registers a model updating event listener that creates a revision
     * snapshot of the current data before each update.
     *
     * @return void
     */
    protected static function bootHasRevisions(): void
    {
        static::updating(function ($model) {
            $model->createRevision();
        });
    }

    /**
     * Get all revisions for this model, ordered by version number descending.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany<ContentRevision, $this>
     */
    public function revisions(): MorphMany
    {
        return $this->morphMany(ContentRevision::class, 'revisionable')
            ->orderBy('version_number', 'desc');
    }

    /**
     * Create a new revision snapshot of the model's current (original) data.
     *
     * @param  string|null  $changeSummary Optional description of what changed
     * @return ContentRevision The newly created revision
     */
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

    /**
     * Restore the model to the state captured in the given revision.
     *
     * Only fillable attributes from the revision data are restored.
     *
     * @param  ContentRevision  $revision The revision to restore from
     * @return $this
     */
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

    /**
     * Get the most recent revision for this model.
     *
     * @return ContentRevision|null
     */
    public function latestRevision(): ?ContentRevision
    {
        return $this->revisions()->first();
    }

    /**
     * Prune old revisions, keeping only the most recent entries.
     *
     * @param  int  $keep Number of recent revisions to retain (default: 50)
     * @return void
     */
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
