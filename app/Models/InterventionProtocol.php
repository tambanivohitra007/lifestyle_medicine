<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the steps for this protocol.
     */
    public function steps(): HasMany
    {
        return $this->hasMany(ProtocolStep::class, 'protocol_id')->orderBy('step_number');
    }
}
