<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a human body system used to classify conditions.
 *
 * Body systems (e.g., Cardiovascular, Respiratory, Digestive) serve as a top-level
 * organizational structure for conditions. Each body system can contain categories
 * for further classification and has optional SNOMED coding, icon, and color
 * for UI presentation.
 *
 * @property string $id UUID primary key
 * @property string $name The body system name (e.g., "Cardiovascular System")
 * @property string|null $slug URL-friendly slug
 * @property string|null $snomed_code SNOMED CT code for the body system
 * @property string|null $description Description of the body system
 * @property string|null $icon Icon identifier for UI display
 * @property string|null $color Color code for UI display
 * @property int|null $display_order Display ordering position
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ConditionCategory> $categories
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Condition> $conditions
 */
class BodySystem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'snomed_code',
        'description',
        'icon',
        'color',
        'display_order',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    /**
     * Get all categories under this body system.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ConditionCategory, $this>
     */
    public function categories(): HasMany
    {
        return $this->hasMany(ConditionCategory::class)->orderBy('display_order');
    }

    /**
     * Get all conditions linked to this body system.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Condition, $this>
     */
    public function conditions(): HasMany
    {
        return $this->hasMany(Condition::class);
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
