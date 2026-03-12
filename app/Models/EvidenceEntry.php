<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents an individual evidence entry supporting an intervention.
 *
 * Evidence entries capture details about specific studies or research that support
 * an intervention's effectiveness, including study type, population, sample size,
 * quality rating, and recommendation strength. Each entry can cite multiple
 * scientific references.
 *
 * @property string $id UUID primary key
 * @property string $intervention_id Foreign key to the parent intervention
 * @property string|null $study_type Type of study (e.g., RCT, meta-analysis, cohort)
 * @property string|null $population Study population description
 * @property int|null $sample_size Number of participants in the study
 * @property string|null $quality_rating Quality rating of the evidence
 * @property string|null $recommendation_strength Strength of the recommendation
 * @property string|null $summary Summary of the evidence findings
 * @property string|null $notes Additional notes about the evidence
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read Intervention $intervention
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Reference> $references
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class EvidenceEntry extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'intervention_id',
        'study_type',
        'population',
        'sample_size',
        'quality_rating',
        'recommendation_strength',
        'summary',
        'notes',
    ];

    protected $casts = [
        'sample_size' => 'integer',
    ];

    /**
     * Get the intervention this evidence belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the references cited by this evidence.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Reference, $this>
     */
    public function references(): BelongsToMany
    {
        return $this->belongsToMany(Reference::class, 'evidence_reference')
            ->withPivot(['created_by', 'updated_by', 'deleted_by'])
            ->withTimestamps();
    }
}
