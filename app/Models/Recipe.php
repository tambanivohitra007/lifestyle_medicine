<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recipe extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'title',
        'description',
        'dietary_tags',
        'ingredients',
        'instructions',
        'servings',
        'prep_time_minutes',
        'cook_time_minutes',
    ];

    protected $casts = [
        'dietary_tags' => 'array',
        'ingredients' => 'array',
        'servings' => 'integer',
        'prep_time_minutes' => 'integer',
        'cook_time_minutes' => 'integer',
    ];

    /**
     * Get the conditions linked to this recipe.
     */
    public function conditions(): BelongsToMany
    {
        return $this->belongsToMany(Condition::class, 'condition_recipe')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the interventions linked to this recipe.
     */
    public function interventions(): BelongsToMany
    {
        return $this->belongsToMany(Intervention::class, 'intervention_recipe')
            ->withPivot(['relevance_note', 'order_index', 'created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the content tags for this recipe.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'recipe_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }
}
