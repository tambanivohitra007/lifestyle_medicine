<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents an individual step within an intervention protocol.
 *
 * Protocol steps provide granular, ordered instructions for carrying out an
 * intervention. Each step includes timing information (duration, week range),
 * a phase name, detailed instructions, and optional tips for the practitioner.
 *
 * @property string $id UUID primary key
 * @property string $protocol_id Foreign key to the parent intervention protocol
 * @property int $step_number Sequential step number for ordering
 * @property string|null $phase_name Name of the protocol phase this step belongs to
 * @property string $title The step title
 * @property string|null $description Brief description of the step
 * @property int|null $duration_minutes Duration of this step in minutes
 * @property int|null $week_start Starting week for this step
 * @property int|null $week_end Ending week for this step
 * @property string|null $frequency How often this step should be performed
 * @property string|null $instructions Detailed step-by-step instructions
 * @property string|null $tips Helpful tips and notes for practitioners
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read InterventionProtocol $protocol
 */
class ProtocolStep extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'protocol_id',
        'step_number',
        'phase_name',
        'title',
        'description',
        'duration_minutes',
        'week_start',
        'week_end',
        'frequency',
        'instructions',
        'tips',
    ];

    protected $casts = [
        'step_number' => 'integer',
        'duration_minutes' => 'integer',
        'week_start' => 'integer',
        'week_end' => 'integer',
    ];

    /**
     * Get the protocol this step belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<InterventionProtocol, $this>
     */
    public function protocol(): BelongsTo
    {
        return $this->belongsTo(InterventionProtocol::class, 'protocol_id');
    }
}
