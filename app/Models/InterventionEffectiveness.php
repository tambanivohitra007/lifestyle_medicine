<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents the effectiveness rating of an intervention for a specific condition.
 *
 * This pivot-like model links an intervention to a condition with an effectiveness
 * rating (very_high, high, moderate, low, uncertain), evidence grade, and notes.
 * It enables comparative analysis of how well different interventions work for
 * different conditions.
 *
 * @property string $id UUID primary key
 * @property string $intervention_id Foreign key to the intervention
 * @property string $condition_id Foreign key to the condition
 * @property string $effectiveness_rating Rating level (very_high, high, moderate, low, uncertain)
 * @property string|null $evidence_grade Grade of supporting evidence
 * @property bool $is_primary Whether this is the primary intervention for the condition
 * @property string|null $notes Additional notes about effectiveness
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read int $effectiveness_score Numeric score derived from effectiveness_rating (accessor, 0-5)
 * @property-read Intervention $intervention
 * @property-read Condition $condition
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the condition.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Scope to get primary interventions only.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to filter by effectiveness rating.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $rating The effectiveness rating to filter by
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByRating($query, string $rating)
    {
        return $query->where('effectiveness_rating', $rating);
    }

    /**
     * Scope to get high effectiveness (very_high or high).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeHighEffectiveness($query)
    {
        return $query->whereIn('effectiveness_rating', ['very_high', 'high']);
    }

    /**
     * Get the numeric score for the effectiveness rating.
     *
     * Maps effectiveness_rating to a 0-5 scale: very_high=5, high=4,
     * moderate=3, low=2, uncertain=1, unknown=0.
     *
     * @return int
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
