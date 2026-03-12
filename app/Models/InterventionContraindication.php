<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a contraindication for an intervention.
 *
 * Contraindications specify conditions or circumstances under which an intervention
 * should not be used or requires caution. Each contraindication may optionally link
 * to a specific condition, includes a severity level, and can suggest alternative
 * recommendations.
 *
 * @property string $id UUID primary key
 * @property string $intervention_id Foreign key to the parent intervention
 * @property string|null $condition_id Foreign key to the related condition (if any)
 * @property string $title The contraindication title
 * @property string|null $description Detailed description of the contraindication
 * @property string|null $severity Severity level of the contraindication
 * @property string|null $alternative_recommendation Suggested alternative when this contraindication applies
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Intervention $intervention
 * @property-read Condition|null $condition
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the related condition (if any).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }
}
