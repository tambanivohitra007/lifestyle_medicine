<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a potential complication arising from a medical condition.
 *
 * Complications link a source condition to potential adverse outcomes, which may
 * optionally reference another condition in the system. Each complication includes
 * likelihood, timeframe, and whether it is preventable through lifestyle interventions.
 *
 * @property string $id UUID primary key
 * @property string $source_condition_id Foreign key to the source condition
 * @property string|null $complication_condition_id Foreign key to the linked complication condition (if it exists in the system)
 * @property string $name The complication name
 * @property string|null $description Description of the complication
 * @property string|null $likelihood Likelihood level (common, occasional, rare)
 * @property string|null $timeframe Expected timeframe for the complication to develop
 * @property bool $preventable Whether the complication is preventable
 * @property int|null $order_index Display ordering position
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read Condition $sourceCondition
 * @property-read Condition|null $complicationCondition
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class ConditionComplication extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    // Likelihood Levels
    public const LIKELIHOOD_COMMON = 'common';
    public const LIKELIHOOD_OCCASIONAL = 'occasional';
    public const LIKELIHOOD_RARE = 'rare';

    protected $fillable = [
        'source_condition_id',
        'complication_condition_id',
        'name',
        'description',
        'likelihood',
        'timeframe',
        'preventable',
        'order_index',
    ];

    protected $casts = [
        'preventable' => 'boolean',
        'order_index' => 'integer',
    ];

    /**
     * Get the source condition this complication belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function sourceCondition(): BelongsTo
    {
        return $this->belongsTo(Condition::class, 'source_condition_id');
    }

    /**
     * Get the linked complication condition (if exists in the system).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function complicationCondition(): BelongsTo
    {
        return $this->belongsTo(Condition::class, 'complication_condition_id');
    }

    /**
     * Get all available likelihood levels.
     *
     * @return array<string, string> Map of likelihood constant to display label
     */
    public static function getLikelihoodLevels(): array
    {
        return [
            self::LIKELIHOOD_COMMON => 'Common',
            self::LIKELIHOOD_OCCASIONAL => 'Occasional',
            self::LIKELIHOOD_RARE => 'Rare',
        ];
    }

    /**
     * Check if this complication is common.
     *
     * @return bool
     */
    public function isCommon(): bool
    {
        return $this->likelihood === self::LIKELIHOOD_COMMON;
    }

    /**
     * Check if this complication is preventable.
     *
     * @return bool
     */
    public function isPreventable(): bool
    {
        return $this->preventable === true;
    }

    /**
     * Check if this complication links to an existing condition in the system.
     *
     * @return bool
     */
    public function hasLinkedCondition(): bool
    {
        return $this->complication_condition_id !== null;
    }
}
