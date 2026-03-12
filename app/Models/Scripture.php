<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use App\Models\Traits\HasPublishingStatus;
use App\Models\Traits\HasRevisions;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a Bible scripture passage used for spiritual guidance in health contexts.
 *
 * Scriptures are linked to conditions and interventions to provide biblical support
 * and spiritual encouragement as part of the gospel medical evangelism approach.
 * Each scripture has a reference (e.g., "John 3:16"), the text content, and a theme.
 *
 * @property string $id UUID primary key
 * @property string $reference The Bible reference (e.g., "Psalm 103:3")
 * @property string|null $text The scripture text content
 * @property string|null $theme The spiritual or health theme of the scripture
 * @property string $status Publishing status (draft, in_review, published, archived)
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Condition> $conditions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Intervention> $interventions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentTag> $tags
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentRevision> $revisions
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class Scripture extends Model
{
    use HasAuditFields, HasFactory, HasPublishingStatus, HasRevisions, HasUuids, SoftDeletes;

    protected $fillable = [
        'reference',
        'text',
        'theme',
        'status',
    ];

    /**
     * Get the conditions linked to this scripture.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Condition, $this>
     */
    public function conditions(): BelongsToMany
    {
        return $this->belongsToMany(Condition::class, 'condition_scripture')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the interventions linked to this scripture.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Intervention, $this>
     */
    public function interventions(): BelongsToMany
    {
        return $this->belongsToMany(Intervention::class, 'intervention_scripture')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the content tags for this scripture.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<ContentTag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'scripture_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }
}
