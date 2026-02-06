<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
     */
    public function categories(): HasMany
    {
        return $this->hasMany(ConditionCategory::class)->orderBy('display_order');
    }

    /**
     * Get all conditions linked to this body system.
     */
    public function conditions(): HasMany
    {
        return $this->hasMany(Condition::class);
    }

    /**
     * Scope to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order');
    }
}
