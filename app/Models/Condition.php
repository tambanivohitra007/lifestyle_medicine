<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use App\Models\Traits\HasMedia;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Condition extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields, HasMedia;

    protected $fillable = [
        'name',
        'category',
        'summary',
    ];

    /**
     * Get the sections for this condition.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(ConditionSection::class);
    }

    /**
     * Get the interventions for this condition.
     */
    public function interventions(): BelongsToMany
    {
        return $this->belongsToMany(Intervention::class, 'condition_interventions')
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
     * Get the scriptures linked to this condition.
     */
    public function scriptures(): BelongsToMany
    {
        return $this->belongsToMany(Scripture::class, 'condition_scripture')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the recipes linked to this condition.
     */
    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'condition_recipe')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the EGW references linked to this condition.
     */
    public function egwReferences(): BelongsToMany
    {
        return $this->belongsToMany(EgwReference::class, 'condition_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the infographic generation requests for this condition.
     */
    public function infographicRequests(): HasMany
    {
        return $this->hasMany(InfographicGenerationRequest::class);
    }

    /**
     * Get infographics (media items of type 'infographic').
     */
    public function infographics()
    {
        return $this->media()->where('type', 'infographic');
    }

    /**
     * Get the risk factors for this condition.
     */
    public function riskFactors(): HasMany
    {
        return $this->hasMany(ConditionRiskFactor::class)->orderBy('order_index');
    }

    /**
     * Get the complications for this condition.
     */
    public function complications(): HasMany
    {
        return $this->hasMany(ConditionComplication::class, 'source_condition_id')->orderBy('order_index');
    }

    /**
     * Get conditions that have this condition as a complication.
     */
    public function complicationOf(): HasMany
    {
        return $this->hasMany(ConditionComplication::class, 'complication_condition_id');
    }
}
