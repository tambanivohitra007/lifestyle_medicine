<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a structured content section within a condition.
 *
 * Condition sections allow conditions to have multiple organized content blocks,
 * such as "Overview", "Symptoms", "Pathophysiology", etc. Each section has a type,
 * title, rich-text body, and an order index for display sequencing.
 *
 * @property string $id UUID primary key
 * @property string $condition_id Foreign key to the parent condition
 * @property string $section_type The type/category of the section
 * @property string $title The section heading
 * @property string|null $body The rich-text content of the section
 * @property int|null $order_index Display ordering position
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read Condition $condition
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class ConditionSection extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'condition_id',
        'section_type',
        'title',
        'body',
        'order_index',
    ];

    protected $casts = [
        'order_index' => 'integer',
    ];

    /**
     * Get the condition that owns this section.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }
}
