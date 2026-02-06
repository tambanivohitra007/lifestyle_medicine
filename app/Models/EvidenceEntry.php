<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvidenceEntry extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'intervention_id',
        'study_type',
        'population',
        'sample_size',
        'quality_rating',
        'recommendation_strength',
        'summary',
        'notes',
    ];

    protected $casts = [
        'sample_size' => 'integer',
    ];

    /**
     * Get the intervention this evidence belongs to.
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the references cited by this evidence.
     */
    public function references(): BelongsToMany
    {
        return $this->belongsToMany(Reference::class, 'evidence_reference')
            ->withPivot(['created_by', 'updated_by', 'deleted_by'])
            ->withTimestamps();
    }
}
