<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a tag used to categorize and cross-reference content items.
 *
 * Content tags can be applied to interventions, recipes, scriptures, and EGW
 * references to enable flexible content discovery and filtering across the platform.
 *
 * @property int $id Auto-increment primary key
 * @property string $tag The tag text
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Intervention> $interventions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Recipe> $recipes
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Scripture> $scriptures
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EgwReference> $egwReferences
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class ContentTag extends Model
{
    use HasAuditFields, HasFactory, SoftDeletes;

    protected $fillable = [
        'tag',
    ];

    /**
     * Get the interventions with this tag.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Intervention, $this>
     */
    public function interventions(): BelongsToMany
    {
        return $this->belongsToMany(Intervention::class, 'intervention_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the recipes with this tag.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Recipe, $this>
     */
    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'recipe_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the scriptures with this tag.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Scripture, $this>
     */
    public function scriptures(): BelongsToMany
    {
        return $this->belongsToMany(Scripture::class, 'scripture_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the EGW references with this tag.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<EgwReference, $this>
     */
    public function egwReferences(): BelongsToMany
    {
        return $this->belongsToMany(EgwReference::class, 'egw_reference_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }
}
