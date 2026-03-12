<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a sub-category within a body system for classifying conditions.
 *
 * Condition categories provide a second level of organization beneath body systems,
 * allowing conditions to be grouped into more specific classifications
 * (e.g., "Coronary Artery Diseases" under "Cardiovascular System").
 *
 * @property string $id UUID primary key
 * @property string $body_system_id Foreign key to the parent body system
 * @property string $name The category name
 * @property string|null $slug URL-friendly slug
 * @property string|null $description Description of the category
 * @property int|null $display_order Display ordering position
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read BodySystem $bodySystem
 */
class ConditionCategory extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'body_system_id',
        'name',
        'slug',
        'description',
        'display_order',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    /**
     * Get the body system this category belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<BodySystem, $this>
     */
    public function bodySystem(): BelongsTo
    {
        return $this->belongsTo(BodySystem::class);
    }

    /**
     * Scope to order by display order.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order');
    }
}
