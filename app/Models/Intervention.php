<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use App\Models\Traits\HasMedia;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Intervention extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields, HasMedia;

    protected $fillable = [
        'care_domain_id',
        'name',
        'description',
        'mechanism',
        'snomed_code',
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
            ->withPivot(['relevance_note', 'order_index', 'created_by', 'deleted_by'])
            ->withTimestamps()
            ->orderByPivot('order_index');
    }

    /**
     * Get the EGW references linked to this intervention.
     */
    public function egwReferences(): BelongsToMany
    {
        return $this->belongsToMany(EgwReference::class, 'intervention_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the protocol for this intervention.
     */
    public function protocol(): HasOne
    {
        return $this->hasOne(InterventionProtocol::class);
    }

    /**
     * Get the contraindications for this intervention.
     */
    public function contraindications(): HasMany
    {
        return $this->hasMany(InterventionContraindication::class);
    }

    /**
     * Get the expected outcomes for this intervention.
     */
    public function outcomes(): HasMany
    {
        return $this->hasMany(InterventionOutcome::class)->orderBy('order_index');
    }

    /**
     * Get the effectiveness ratings for this intervention across conditions.
     */
    public function effectivenessRatings(): HasMany
    {
        return $this->hasMany(InterventionEffectiveness::class);
    }

    /**
     * Get evidence summaries for this intervention.
     */
    public function evidenceSummaries(): HasMany
    {
        return $this->hasMany(EvidenceSummary::class);
    }

    /**
     * Get relationships where this intervention is the first one.
     */
    public function relationshipsAsA(): HasMany
    {
        return $this->hasMany(InterventionRelationship::class, 'intervention_a_id');
    }

    /**
     * Get relationships where this intervention is the second one.
     */
    public function relationshipsAsB(): HasMany
    {
        return $this->hasMany(InterventionRelationship::class, 'intervention_b_id');
    }

    /**
     * Get all relationships involving this intervention.
     */
    public function getAllRelationships()
    {
        return InterventionRelationship::where('intervention_a_id', $this->id)
            ->orWhere('intervention_b_id', $this->id)
            ->with(['interventionA', 'interventionB'])
            ->get();
    }

    /**
     * Get synergistic interventions.
     */
    public function getSynergisticInterventions()
    {
        return $this->getAllRelationships()
            ->filter(fn($r) => $r->isPositive())
            ->map(fn($r) => $r->getOtherIntervention($this->id));
    }

    /**
     * Get conflicting interventions.
     */
    public function getConflictingInterventions()
    {
        return $this->getAllRelationships()
            ->filter(fn($r) => $r->isNegative())
            ->map(fn($r) => $r->getOtherIntervention($this->id));
    }
}
