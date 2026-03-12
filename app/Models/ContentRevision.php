<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Represents a versioned snapshot of a model's data for revision history.
 *
 * Content revisions store previous states of revisionable models, enabling
 * version control and the ability to restore content to earlier versions.
 * Each revision captures the full model data as a JSON array along with
 * a version number, optional change summary, and creator information.
 * Timestamps are managed manually (not via Eloquent's auto-timestamps).
 *
 * @property string $id UUID primary key
 * @property string $revisionable_type The polymorphic parent model class
 * @property string $revisionable_id The polymorphic parent model ID
 * @property int $version_number Sequential version number for the revisionable model
 * @property array|null $data Snapshot of the model's data at this version
 * @property string|null $change_summary Description of what changed in this version
 * @property int|null $created_by ID of the user who created this revision
 * @property \Illuminate\Support\Carbon|null $created_at When this revision was created
 *
 * @property-read Model $revisionable The parent model this revision belongs to
 * @property-read User|null $creator The user who created this revision
 */
class ContentRevision extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'revisionable_type',
        'revisionable_id',
        'version_number',
        'data',
        'change_summary',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'data' => 'array',
        'version_number' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Get the parent revisionable model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphTo<Model, $this>
     */
    public function revisionable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who created this revision.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the next version number for a given revisionable model.
     *
     * @param  string  $type The fully qualified class name of the revisionable model
     * @param  string  $id The UUID of the revisionable model
     * @return int The next sequential version number
     */
    public static function getNextVersionNumber(string $type, string $id): int
    {
        $max = static::where('revisionable_type', $type)
            ->where('revisionable_id', $id)
            ->max('version_number');

        return ($max ?? 0) + 1;
    }
}
