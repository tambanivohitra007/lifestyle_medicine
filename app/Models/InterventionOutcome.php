<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents an expected outcome or measurable result of an intervention.
 *
 * Intervention outcomes define what improvements or changes can be expected when
 * following an intervention, including the timeline, direction of change, evidence
 * grade, and measurement methods. They provide evidence-based expectations for
 * practitioners and patients.
 *
 * @property string $id UUID primary key
 * @property string $intervention_id Foreign key to the parent intervention
 * @property string $outcome_measure The metric or indicator being measured
 * @property string|null $expected_change Description of the expected change
 * @property string|null $direction Direction of expected change (e.g., increase, decrease)
 * @property int|null $timeline_weeks Expected timeline to see results in weeks
 * @property string|null $evidence_grade Grade of evidence supporting this outcome
 * @property string|null $measurement_method How the outcome should be measured
 * @property string|null $notes Additional notes about the outcome
 * @property int|null $order_index Display ordering position
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Intervention $intervention
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
class InterventionOutcome extends Model
{
    use HasFactory, HasUuids, HasAuditFields;

    protected $fillable = [
        'intervention_id',
        'outcome_measure',
        'expected_change',
        'direction',
        'timeline_weeks',
        'evidence_grade',
        'measurement_method',
        'notes',
        'order_index',
    ];

    protected $casts = [
        'timeline_weeks' => 'integer',
        'order_index' => 'integer',
    ];

    /**
     * Get the intervention this outcome belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }
}
