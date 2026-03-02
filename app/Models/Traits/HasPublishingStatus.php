<?php

namespace App\Models\Traits;

trait HasPublishingStatus
{
    const STATUS_DRAFT = 'draft';

    const STATUS_IN_REVIEW = 'in_review';

    const STATUS_PUBLISHED = 'published';

    const STATUS_ARCHIVED = 'archived';

    /**
     * Boot the trait.
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
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    /**
     * Scope: only drafts.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope: only items in review.
     */
    public function scopeInReview($query)
    {
        return $query->where('status', self::STATUS_IN_REVIEW);
    }

    /**
     * Scope: only archived items.
     */
    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    /**
     * Scope: filter by a specific status.
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if the item is a draft.
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if the item is published.
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /**
     * Check if the item is in review.
     */
    public function isInReview(): bool
    {
        return $this->status === self::STATUS_IN_REVIEW;
    }

    /**
     * Check if the item is archived.
     */
    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    /**
     * Publish the item.
     */
    public function publish(): self
    {
        $this->status = self::STATUS_PUBLISHED;
        $this->save();

        return $this;
    }

    /**
     * Submit the item for review.
     */
    public function submitForReview(): self
    {
        $this->status = self::STATUS_IN_REVIEW;
        $this->save();

        return $this;
    }

    /**
     * Archive the item.
     */
    public function archive(): self
    {
        $this->status = self::STATUS_ARCHIVED;
        $this->save();

        return $this;
    }

    /**
     * Return the item to draft.
     */
    public function returnToDraft(): self
    {
        $this->status = self::STATUS_DRAFT;
        $this->save();

        return $this;
    }

    /**
     * Get all available statuses.
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
