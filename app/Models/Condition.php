<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use App\Models\Traits\HasMedia;
use App\Models\Traits\HasPublishingStatus;
use App\Models\Traits\HasRevisions;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a medical condition or health issue in the lifestyle medicine platform.
 *
 * Conditions are the central entity linking interventions, scriptures, recipes,
 * EGW references, and related clinical data such as risk factors, complications,
 * and evidence summaries. Each condition belongs to a body system and can have
 * multiple content sections for structured information.
 *
 * @property string $id UUID primary key
 * @property string $name The name of the condition
 * @property string|null $category The condition category
 * @property string|null $body_system_id Foreign key to the body system
 * @property string|null $summary Brief description of the condition
 * @property string|null $snomed_code SNOMED CT clinical terminology code
 * @property string|null $icd10_code ICD-10 diagnostic code
 * @property string $status Publishing status (draft, in_review, published, archived)
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read BodySystem|null $bodySystem
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ConditionSection> $sections
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Intervention> $interventions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Scripture> $scriptures
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Recipe> $recipes
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EgwReference> $egwReferences
 * @property-read \Illuminate\Database\Eloquent\Collection<int, InfographicGenerationRequest> $infographicRequests
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ConditionRiskFactor> $riskFactors
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ConditionComplication> $complications
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ConditionComplication> $complicationOf
 * @property-read \Illuminate\Database\Eloquent\Collection<int, InterventionEffectiveness> $effectivenessRatings
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EvidenceSummary> $evidenceSummaries
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Media> $media
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentRevision> $revisions
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 * @property-read Media|null $featuredImage
 */
class Condition extends Model
{
    use HasAuditFields, HasFactory, HasMedia, HasPublishingStatus, HasRevisions, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'category',
        'body_system_id',
        'summary',
        'snomed_code',
        'icd10_code',
        'status',
    ];

    /**
     * Get the body system this condition belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<BodySystem, $this>
     */
    public function bodySystem(): BelongsTo
    {
        return $this->belongsTo(BodySystem::class);
    }

    /**
     * Get the sections for this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ConditionSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(ConditionSection::class);
    }

    /**
     * Get the interventions for this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Intervention, $this>
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Scripture, $this>
     */
    public function scriptures(): BelongsToMany
    {
        return $this->belongsToMany(Scripture::class, 'condition_scripture')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the recipes linked to this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Recipe, $this>
     */
    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'condition_recipe')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the EGW references linked to this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<EgwReference, $this>
     */
    public function egwReferences(): BelongsToMany
    {
        return $this->belongsToMany(EgwReference::class, 'condition_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the infographic generation requests for this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<InfographicGenerationRequest, $this>
     */
    public function infographicRequests(): HasMany
    {
        return $this->hasMany(InfographicGenerationRequest::class);
    }

    /**
     * Get infographics (media items of type 'infographic').
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany<Media, $this>
     */
    public function infographics()
    {
        return $this->media()->where('type', 'infographic');
    }

    /**
     * Get the risk factors for this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ConditionRiskFactor, $this>
     */
    public function riskFactors(): HasMany
    {
        return $this->hasMany(ConditionRiskFactor::class)->orderBy('order_index');
    }

    /**
     * Get the complications for this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ConditionComplication, $this>
     */
    public function complications(): HasMany
    {
        return $this->hasMany(ConditionComplication::class, 'source_condition_id')->orderBy('order_index');
    }

    /**
     * Get conditions that have this condition as a complication.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ConditionComplication, $this>
     */
    public function complicationOf(): HasMany
    {
        return $this->hasMany(ConditionComplication::class, 'complication_condition_id');
    }

    /**
     * Get the effectiveness ratings for interventions linked to this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<InterventionEffectiveness, $this>
     */
    public function effectivenessRatings(): HasMany
    {
        return $this->hasMany(InterventionEffectiveness::class);
    }

    /**
     * Get evidence summaries for this condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<EvidenceSummary, $this>
     */
    public function evidenceSummaries(): HasMany
    {
        return $this->hasMany(EvidenceSummary::class);
    }
}
