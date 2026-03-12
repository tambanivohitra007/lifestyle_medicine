<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a structured protocol for implementing an intervention.
 *
 * Protocols define the practical implementation details of an intervention, including
 * duration, frequency, intensity, prerequisites, and required equipment. Each protocol
 * contains ordered steps that guide the user through the intervention process.
 *
 * @property string $id UUID primary key
 * @property string $intervention_id Foreign key to the parent intervention
 * @property string|null $version Protocol version identifier
 * @property int|null $duration_weeks Total protocol duration in weeks
 * @property int|null $frequency_per_week Recommended frequency per week
 * @property string|null $intensity_level Intensity level descriptor
 * @property string|null $overview High-level overview of the protocol
 * @property string|null $prerequisites Requirements before starting the protocol
 * @property string|null $equipment_needed Equipment or materials required
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Intervention $intervention
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ProtocolStep> $steps
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
class InterventionProtocol extends Model
{
    use HasFactory, HasUuids, HasAuditFields;

    protected $fillable = [
        'intervention_id',
        'version',
        'duration_weeks',
        'frequency_per_week',
        'intensity_level',
        'overview',
        'prerequisites',
        'equipment_needed',
    ];

    protected $casts = [
        'duration_weeks' => 'integer',
        'frequency_per_week' => 'integer',
    ];

    /**
     * Get the intervention this protocol belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the steps for this protocol.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ProtocolStep, $this>
     */
    public function steps(): HasMany
    {
        return $this->hasMany(ProtocolStep::class, 'protocol_id')->orderBy('step_number');
    }
}
