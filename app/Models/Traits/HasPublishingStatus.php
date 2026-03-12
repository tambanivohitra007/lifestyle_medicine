<?php

namespace App\Models\Traits;

/**
 * Provides a publishing workflow with status management for Eloquent models.
 *
 * This trait implements a four-state publishing workflow: draft -> in_review -> published -> archived.
 * Models using this trait automatically default to 'draft' status on creation if no status is set.
 * It provides query scopes for filtering by status, boolean checks for the current status,
 * and methods to transition between states.
 *
 * Required database column: `status` (string, defaults to 'draft').
 *
 * Available statuses: draft, in_review, published, archived.
 *
 * @property string $status The current publishing status
 */
trait HasPublishingStatus
{
    const STATUS_DRAFT = 'draft';

    const STATUS_IN_REVIEW = 'in_review';

    const STATUS_PUBLISHED = 'published';

    const STATUS_ARCHIVED = 'archived';

    /**
     * Boot the trait.
     *
     * Sets the default status to 'draft' when creating a new model if no status is provided.
     *
     * @return void
     */
    protected static function bootHasPublishingStatus(): void
    {
        static::creating(function ($model) {
            if (empty($model->status)) {
                $model->status = self::STATUS_DRAFT;
            }
        });
    }

    /**
     * Scope: only published items.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    /**
     * Scope: only drafts.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope: only items in review.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInReview($query)
    {
        return $query->where('status', self::STATUS_IN_REVIEW);
    }

    /**
     * Scope: only archived items.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    /**
     * Scope: filter by a specific status.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $status The status value to filter by
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if the item is a draft.
     *
     * @return bool
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if the item is published.
     *
     * @return bool
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /**
     * Check if the item is in review.
     *
     * @return bool
     */
    public function isInReview(): bool
    {
        return $this->status === self::STATUS_IN_REVIEW;
    }

    /**
     * Check if the item is archived.
     *
     * @return bool
     */
    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    /**
     * Publish the item by setting status to published and saving.
     *
     * @return $this
     */
    public function publish(): self
    {
        $this->status = self::STATUS_PUBLISHED;
        $this->save();

        return $this;
    }

    /**
     * Submit the item for review by setting status to in_review and saving.
     *
     * @return $this
     */
    public function submitForReview(): self
    {
        $this->status = self::STATUS_IN_REVIEW;
        $this->save();

        return $this;
    }

    /**
     * Archive the item by setting status to archived and saving.
     *
     * @return $this
     */
    public function archive(): self
    {
        $this->status = self::STATUS_ARCHIVED;
        $this->save();

        return $this;
    }

    /**
     * Return the item to draft by setting status to draft and saving.
     *
     * @return $this
     */
    public function returnToDraft(): self
    {
        $this->status = self::STATUS_DRAFT;
        $this->save();

        return $this;
    }

    /**
     * Get all available statuses as a key-value map.
     *
     * @return array<string, string> Map of status constant to display label
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_IN_REVIEW => 'In Review',
            self::STATUS_PUBLISHED => 'Published',
            self::STATUS_ARCHIVED => 'Archived',
        ];
    }
}
