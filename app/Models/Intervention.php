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
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a lifestyle medicine intervention or treatment approach.
 *
 * Interventions belong to a care domain (aligned with NEWSTART+ principles) and
 * can be linked to conditions, scriptures, recipes, EGW references, and evidence
 * entries. Each intervention may have a protocol with steps, contraindications,
 * expected outcomes, effectiveness ratings, and relationships with other interventions.
 *
 * @property string $id UUID primary key
 * @property string|null $care_domain_id Foreign key to the care domain
 * @property string $name The name of the intervention
 * @property string|null $description Detailed description of the intervention
 * @property string|null $mechanism How the intervention works mechanistically
 * @property string|null $snomed_code SNOMED CT clinical terminology code
 * @property string $status Publishing status (draft, in_review, published, archived)
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read CareDomain|null $careDomain
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Condition> $conditions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EvidenceEntry> $evidenceEntries
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentTag> $tags
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Scripture> $scriptures
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Recipe> $recipes
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EgwReference> $egwReferences
 * @property-read InterventionProtocol|null $protocol
 * @property-read \Illuminate\Database\Eloquent\Collection<int, InterventionContraindication> $contraindications
 * @property-read \Illuminate\Database\Eloquent\Collection<int, InterventionOutcome> $outcomes
 * @property-read \Illuminate\Database\Eloquent\Collection<int, InterventionEffectiveness> $effectivenessRatings
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EvidenceSummary> $evidenceSummaries
 * @property-read \Illuminate\Database\Eloquent\Collection<int, InterventionRelationship> $relationshipsAsA
 * @property-read \Illuminate\Database\Eloquent\Collection<int, InterventionRelationship> $relationshipsAsB
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Media> $media
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentRevision> $revisions
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 * @property-read Media|null $featuredImage
 */
class Intervention extends Model
{
    use HasAuditFields, HasFactory, HasMedia, HasPublishingStatus, HasRevisions, HasUuids, SoftDeletes;

    protected $fillable = [
        'care_domain_id',
        'name',
        'description',
        'mechanism',
        'snomed_code',
        'status',
    ];

    /**
     * Get the care domain this intervention belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<CareDomain, $this>
     */
    public function careDomain(): BelongsTo
    {
        return $this->belongsTo(CareDomain::class);
    }

    /**
     * Get the conditions this intervention applies to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Condition, $this>
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<EvidenceEntry, $this>
     */
    public function evidenceEntries(): HasMany
    {
        return $this->hasMany(EvidenceEntry::class);
    }

    /**
     * Get the content tags for this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<ContentTag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'intervention_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the scriptures linked to this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Scripture, $this>
     */
    public function scriptures(): BelongsToMany
    {
        return $this->belongsToMany(Scripture::class, 'intervention_scripture')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the recipes linked to this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Recipe, $this>
     */
    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'intervention_recipe')
            ->withPivot(['relevance_note', 'order_index', 'created_by', 'deleted_by'])
            ->withTimestamps()
            ->orderByPivot('order_index');
    }

    /**
     * Get the EGW references linked to this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<EgwReference, $this>
     */
    public function egwReferences(): BelongsToMany
    {
        return $this->belongsToMany(EgwReference::class, 'intervention_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the protocol for this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<InterventionProtocol, $this>
     */
    public function protocol(): HasOne
    {
        return $this->hasOne(InterventionProtocol::class);
    }

    /**
     * Get the contraindications for this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<InterventionContraindication, $this>
     */
    public function contraindications(): HasMany
    {
        return $this->hasMany(InterventionContraindication::class);
    }

    /**
     * Get the expected outcomes for this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<InterventionOutcome, $this>
     */
    public function outcomes(): HasMany
    {
        return $this->hasMany(InterventionOutcome::class)->orderBy('order_index');
    }

    /**
     * Get the effectiveness ratings for this intervention across conditions.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<InterventionEffectiveness, $this>
     */
    public function effectivenessRatings(): HasMany
    {
        return $this->hasMany(InterventionEffectiveness::class);
    }

    /**
     * Get evidence summaries for this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<EvidenceSummary, $this>
     */
    public function evidenceSummaries(): HasMany
    {
        return $this->hasMany(EvidenceSummary::class);
    }

    /**
     * Get relationships where this intervention is the first one.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<InterventionRelationship, $this>
     */
    public function relationshipsAsA(): HasMany
    {
        return $this->hasMany(InterventionRelationship::class, 'intervention_a_id');
    }

    /**
     * Get relationships where this intervention is the second one.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<InterventionRelationship, $this>
     */
    public function relationshipsAsB(): HasMany
    {
        return $this->hasMany(InterventionRelationship::class, 'intervention_b_id');
    }

    /**
     * Get all relationships involving this intervention.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, InterventionRelationship>
     */
    public function getAllRelationships()
    {
        return InterventionRelationship::where('intervention_a_id', $this->id)
            ->orWhere('intervention_b_id', $this->id)
            ->with(['interventionA', 'interventionB'])
            ->get();
    }

    /**
     * Get synergistic interventions (those with positive relationships).
     *
     * @return \Illuminate\Support\Collection<int, Intervention>
     */
    public function getSynergisticInterventions()
    {
        return $this->getAllRelationships()
            ->filter(fn ($r) => $r->isPositive())
            ->map(fn ($r) => $r->getOtherIntervention($this->id));
    }

    /**
     * Get conflicting interventions (those with negative relationships).
     *
     * @return \Illuminate\Support\Collection<int, Intervention>
     */
    public function getConflictingInterventions()
    {
        return $this->getAllRelationships()
            ->filter(fn ($r) => $r->isNegative())
            ->map(fn ($r) => $r->getOtherIntervention($this->id));
    }
}
