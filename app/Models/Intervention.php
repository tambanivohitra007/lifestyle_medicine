<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Intervention extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'care_domain_id',
        'name',
        'description',
        'mechanism',
    ];

    /**
     * Get the care domain this intervention belongs to.
     */
    public function careDomain(): BelongsTo
    {
        return $this->belongsTo(CareDomain::class);
    }

    /**
     * Get the conditions this intervention applies to.
     */
    public function conditions(): BelongsToMany
    {
        return $this->belongsToMany(Condition::class, 'condition_interventions')
            ->withPivot([
                'strength_of_evidence',
                'recommendation_level',
                'clinical_notes',
                'order_index',
                'created_by',
                'updated_by',
                'deleted_by',
            ])
            ->withTimestamps();
    }

    /**
     * Get the evidence entries for this intervention.
     */
    public function evidenceEntries(): HasMany
    {
        return $this->hasMany(EvidenceEntry::class);
    }

    /**
     * Get the content tags for this intervention.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'intervention_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the scriptures linked to this intervention.
     */
    public function scriptures(): BelongsToMany
    {
        return $this->belongsToMany(Scripture::class, 'intervention_scripture')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the recipes linked to this intervention.
     */
    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'intervention_recipe')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }
}
