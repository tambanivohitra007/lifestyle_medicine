<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }
}
