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
 * Represents a health-focused recipe linked to conditions and interventions.
 *
 * Recipes contain structured cooking information including ingredients, instructions,
 * dietary tags, and timing. They can be associated with conditions and interventions
 * to provide practical dietary guidance as part of lifestyle medicine protocols.
 *
 * @property string $id UUID primary key
 * @property string $title The recipe title
 * @property string|null $description Brief description of the recipe
 * @property array|null $dietary_tags Tags indicating dietary classifications (e.g., vegan, gluten-free)
 * @property array|null $ingredients List of recipe ingredients
 * @property string|null $instructions Cooking/preparation instructions
 * @property int|null $servings Number of servings
 * @property int|null $prep_time_minutes Preparation time in minutes
 * @property int|null $cook_time_minutes Cooking time in minutes
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
class Recipe extends Model
{
    use HasAuditFields, HasFactory, HasPublishingStatus, HasRevisions, HasUuids, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'dietary_tags',
        'ingredients',
        'instructions',
        'servings',
        'prep_time_minutes',
        'cook_time_minutes',
        'status',
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Condition, $this>
     */
    public function conditions(): BelongsToMany
    {
        return $this->belongsToMany(Condition::class, 'condition_recipe')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the interventions linked to this recipe.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Intervention, $this>
     */
    public function interventions(): BelongsToMany
    {
        return $this->belongsToMany(Intervention::class, 'intervention_recipe')
            ->withPivot(['relevance_note', 'order_index', 'created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the content tags for this recipe.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<ContentTag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'recipe_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }
}
