<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
     */
    public function interventionA(): BelongsTo
    {
        return $this->belongsTo(Intervention::class, 'intervention_a_id');
    }

    /**
     * Get the second intervention.
     */
    public function interventionB(): BelongsTo
    {
        return $this->belongsTo(Intervention::class, 'intervention_b_id');
    }

    /**
     * Scope to get synergistic relationships.
     */
    public function scopeSynergies($query)
    {
        return $query->whereIn('relationship_type', ['synergy', 'complementary']);
    }

    /**
     * Scope to get conflicting relationships.
     */
    public function scopeConflicts($query)
    {
        return $query->whereIn('relationship_type', ['caution', 'conflict']);
    }

    /**
     * Scope to find relationships involving a specific intervention.
     */
    public function scopeInvolving($query, string $interventionId)
    {
        return $query->where('intervention_a_id', $interventionId)
            ->orWhere('intervention_b_id', $interventionId);
    }

    /**
     * Get the other intervention in the relationship.
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
     * Check if this is a positive relationship.
     */
    public function isPositive(): bool
    {
        return in_array($this->relationship_type, ['synergy', 'complementary']);
    }

    /**
     * Check if this is a negative relationship.
     */
    public function isNegative(): bool
    {
        return in_array($this->relationship_type, ['caution', 'conflict']);
    }
}
