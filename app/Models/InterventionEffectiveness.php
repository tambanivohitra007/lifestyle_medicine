<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterventionEffectiveness extends Model
{
    use HasFactory, HasUuids, HasAuditFields;

    protected $table = 'intervention_effectiveness';

    protected $fillable = [
        'intervention_id',
        'condition_id',
        'effectiveness_rating',
        'evidence_grade',
        'is_primary',
        'notes',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    /**
     * Get the intervention.
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the condition.
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Scope to get primary interventions only.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to filter by effectiveness rating.
     */
    public function scopeByRating($query, string $rating)
    {
        return $query->where('effectiveness_rating', $rating);
    }

    /**
     * Scope to get high effectiveness (very_high or high).
     */
    public function scopeHighEffectiveness($query)
    {
        return $query->whereIn('effectiveness_rating', ['very_high', 'high']);
    }

    /**
     * Get the numeric score for the effectiveness rating.
     */
    public function getEffectivenessScoreAttribute(): int
    {
        return match ($this->effectiveness_rating) {
            'very_high' => 5,
            'high' => 4,
            'moderate' => 3,
            'low' => 2,
            'uncertain' => 1,
            default => 0,
        };
    }
}
