<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
     */
    public function protocol(): BelongsTo
    {
        return $this->belongsTo(InterventionProtocol::class, 'protocol_id');
    }
}
