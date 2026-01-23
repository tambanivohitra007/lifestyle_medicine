<?php

namespace App\Models\Traits;

use App\Models\Media;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasMedia
{
    /**
     * Get all media attached to this model.
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->orderBy('order_index');
    }

    /**
     * Get only images.
     */
    public function images(): MorphMany
    {
        return $this->media()->where('type', 'image');
    }

    /**
     * Get only documents.
     */
    public function documents(): MorphMany
    {
        return $this->media()->where('type', 'document');
    }

    /**
     * Get the first image (featured image).
     */
    public function getFeaturedImageAttribute(): ?Media
    {
        return $this->images()->first();
    }
}
