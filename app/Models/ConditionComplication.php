<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

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
     */
    public function sourceCondition(): BelongsTo
    {
        return $this->belongsTo(Condition::class, 'source_condition_id');
    }

    /**
     * Get the linked complication condition (if exists in the system).
     */
    public function complicationCondition(): BelongsTo
    {
        return $this->belongsTo(Condition::class, 'complication_condition_id');
    }

    /**
     * Get all available likelihood levels.
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
     */
    public function isCommon(): bool
    {
        return $this->likelihood === self::LIKELIHOOD_COMMON;
    }

    /**
     * Check if this complication is preventable.
     */
    public function isPreventable(): bool
    {
        return $this->preventable === true;
    }

    /**
     * Check if this complication links to an existing condition in the system.
     */
    public function hasLinkedCondition(): bool
    {
        return $this->complication_condition_id !== null;
    }
}
