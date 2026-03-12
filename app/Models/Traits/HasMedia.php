<?php

namespace App\Models\Traits;

use App\Models\Media;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Provides polymorphic media attachment capabilities to Eloquent models.
 *
 * This trait enables models to have attached media files (images, documents,
 * infographics) via a polymorphic morph-many relationship. Media items are
 * ordered by their `order_index` field. Convenience methods are provided for
 * filtering by media type and retrieving the featured image.
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Media> $media
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Media> $images
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Media> $documents
 * @property-read Media|null $featuredImage
 */
trait HasMedia
{
    /**
     * Get all media attached to this model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany<Media, $this>
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->orderBy('order_index');
    }

    /**
     * Get only images.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany<Media, $this>
     */
    public function images(): MorphMany
    {
        return $this->media()->where('type', 'image');
    }

    /**
     * Get only documents.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany<Media, $this>
     */
    public function documents(): MorphMany
    {
        return $this->media()->where('type', 'document');
    }

    /**
     * Get the first image (featured image).
     *
     * @return Media|null
     */
    public function getFeaturedImageAttribute(): ?Media
    {
        return $this->images()->first();
    }
}
