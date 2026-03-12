<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * Represents a media file (image, document, infographic) attached to a model.
 *
 * Media items are polymorphically associated with other models via the mediable
 * relationship. They store file metadata (filename, MIME type, size, disk, path)
 * along with optional alt text and captions. The physical file is stored on a
 * configured disk and deleted from storage when the model is force-deleted.
 *
 * @property string $id UUID primary key
 * @property string $mediable_type The polymorphic parent model class
 * @property string $mediable_id The polymorphic parent model ID
 * @property string $filename The stored filename
 * @property string|null $original_filename The original upload filename
 * @property string|null $mime_type The MIME type of the file
 * @property int|null $size File size in bytes
 * @property string $disk The storage disk name
 * @property string $path The file path on the disk
 * @property string|null $type Media type classification (image, document, infographic)
 * @property string|null $alt_text Alt text for accessibility
 * @property string|null $caption Caption or description
 * @property int|null $order_index Display ordering position
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read string $url Full URL to the media file (accessor)
 * @property-read string $formatted_size Human-readable file size (accessor)
 * @property-read Model $mediable The parent model
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class Media extends Model
{
    use HasUuids, SoftDeletes, HasAuditFields;

    protected $table = 'media';

    protected $fillable = [
        'mediable_type',
        'mediable_id',
        'filename',
        'original_filename',
        'mime_type',
        'size',
        'disk',
        'path',
        'type',
        'alt_text',
        'caption',
        'order_index',
    ];

    protected $casts = [
        'size' => 'integer',
        'order_index' => 'integer',
    ];

    protected $appends = ['url'];

    /**
     * Get the parent mediable model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphTo<Model, $this>
     */
    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the full URL to the media file.
     *
     * @return string
     */
    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    /**
     * Get formatted file size (e.g., "1.50 MB").
     *
     * @return string
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);

        return sprintf("%.2f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }

    /**
     * Check if media is an image.
     *
     * @return bool
     */
    public function isImage(): bool
    {
        return $this->type === 'image';
    }

    /**
     * Check if media is a document.
     *
     * @return bool
     */
    public function isDocument(): bool
    {
        return $this->type === 'document';
    }

    /**
     * Delete the file from storage when the model is force-deleted.
     *
     * @return void
     */
    protected static function booted(): void
    {
        static::deleting(function (Media $media) {
            if ($media->isForceDeleting()) {
                Storage::disk($media->disk)->delete($media->path);
            }
        });
    }
}
