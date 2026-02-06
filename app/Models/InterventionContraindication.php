<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterventionContraindication extends Model
{
    use HasFactory, HasUuids, HasAuditFields;

    protected $fillable = [
        'intervention_id',
        'condition_id',
        'title',
        'description',
        'severity',
        'alternative_recommendation',
    ];

    /**
     * Get the intervention this contraindication belongs to.
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the related condition (if any).
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }
}
