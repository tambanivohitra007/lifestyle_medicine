<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a relationship between two interventions.
 *
 * Intervention relationships capture how two interventions interact with each other,
 * such as synergy (they enhance each other), complementary (they work well together),
 * caution (care needed when combining), or conflict (should not be combined).
 * This enables the knowledge graph to show intervention interactions.
 *
 * @property string $id UUID primary key
 * @property string $intervention_a_id Foreign key to the first intervention
 * @property string $intervention_b_id Foreign key to the second intervention
 * @property string $relationship_type Type of relationship (synergy, complementary, caution, conflict)
 * @property string|null $description Description of the relationship
 * @property string|null $clinical_notes Clinical notes about the interaction
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Intervention $interventionA
 * @property-read Intervention $interventionB
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
class InterventionRelationship extends Model
{
    use HasFactory, HasUuids, HasAuditFields;

    protected $fillable = [
        'intervention_a_id',
        'intervention_b_id',
        'relationship_type',
        'description',
        'clinical_notes',
    ];

    /**
     * Get the first intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function interventionA(): BelongsTo
    {
        return $this->belongsTo(Intervention::class, 'intervention_a_id');
    }

    /**
     * Get the second intervention.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function interventionB(): BelongsTo
    {
        return $this->belongsTo(Intervention::class, 'intervention_b_id');
    }

    /**
     * Scope to get synergistic relationships (synergy or complementary).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSynergies($query)
    {
        return $query->whereIn('relationship_type', ['synergy', 'complementary']);
    }

    /**
     * Scope to get conflicting relationships (caution or conflict).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeConflicts($query)
    {
        return $query->whereIn('relationship_type', ['caution', 'conflict']);
    }

    /**
     * Scope to find relationships involving a specific intervention.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $interventionId The UUID of the intervention to search for
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInvolving($query, string $interventionId)
    {
        return $query->where('intervention_a_id', $interventionId)
            ->orWhere('intervention_b_id', $interventionId);
    }

    /**
     * Get the other intervention in the relationship.
     *
     * Given one intervention's ID, returns the other intervention in the pair.
     * Returns null if the given ID does not match either side of the relationship.
     *
     * @param  string  $interventionId The UUID of the known intervention
     * @return Intervention|null
     */
    public function getOtherIntervention(string $interventionId): ?Intervention
    {
        if ($this->intervention_a_id === $interventionId) {
            return $this->interventionB;
        }
        if ($this->intervention_b_id === $interventionId) {
            return $this->interventionA;
        }
        return null;
    }

    /**
     * Check if this is a positive relationship (synergy or complementary).
     *
     * @return bool
     */
    public function isPositive(): bool
    {
        return in_array($this->relationship_type, ['synergy', 'complementary']);
    }

    /**
     * Check if this is a negative relationship (caution or conflict).
     *
     * @return bool
     */
    public function isNegative(): bool
    {
        return in_array($this->relationship_type, ['caution', 'conflict']);
    }
}
