<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a risk factor associated with a medical condition.
 *
 * Risk factors are categorized by type (modifiable, non-modifiable, environmental,
 * behavioral) and severity (high, moderate, low). Modifiable and behavioral risk
 * factors are particularly relevant to lifestyle medicine as they can be addressed
 * through interventions.
 *
 * @property string $id UUID primary key
 * @property string $condition_id Foreign key to the parent condition
 * @property string $name The risk factor name
 * @property string|null $description Description of the risk factor
 * @property string|null $risk_type Type classification (modifiable, non_modifiable, environmental, behavioral)
 * @property string|null $severity Severity level (high, moderate, low)
 * @property int|null $order_index Display ordering position
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read Condition $condition
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class ConditionRiskFactor extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    // Risk Types
    public const RISK_TYPE_MODIFIABLE = 'modifiable';
    public const RISK_TYPE_NON_MODIFIABLE = 'non_modifiable';
    public const RISK_TYPE_ENVIRONMENTAL = 'environmental';
    public const RISK_TYPE_BEHAVIORAL = 'behavioral';

    // Severity Levels
    public const SEVERITY_HIGH = 'high';
    public const SEVERITY_MODERATE = 'moderate';
    public const SEVERITY_LOW = 'low';

    protected $fillable = [
        'condition_id',
        'name',
        'description',
        'risk_type',
        'severity',
        'order_index',
    ];

    protected $casts = [
        'order_index' => 'integer',
    ];

    /**
     * Get the condition this risk factor belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Get all available risk types.
     *
     * @return array<string, string> Map of risk type constant to display label
     */
    public static function getRiskTypes(): array
    {
        return [
            self::RISK_TYPE_MODIFIABLE => 'Modifiable',
            self::RISK_TYPE_NON_MODIFIABLE => 'Non-Modifiable',
            self::RISK_TYPE_ENVIRONMENTAL => 'Environmental',
            self::RISK_TYPE_BEHAVIORAL => 'Behavioral',
        ];
    }

    /**
     * Get all available severity levels.
     *
     * @return array<string, string> Map of severity constant to display label
     */
    public static function getSeverityLevels(): array
    {
        return [
            self::SEVERITY_HIGH => 'High',
            self::SEVERITY_MODERATE => 'Moderate',
            self::SEVERITY_LOW => 'Low',
        ];
    }

    /**
     * Check if the risk factor is modifiable (modifiable or behavioral type).
     *
     * @return bool
     */
    public function isModifiable(): bool
    {
        return in_array($this->risk_type, [
            self::RISK_TYPE_MODIFIABLE,
            self::RISK_TYPE_BEHAVIORAL,
        ]);
    }

    /**
     * Check if this is a high severity risk factor.
     *
     * @return bool
     */
    public function isHighSeverity(): bool
    {
        return $this->severity === self::SEVERITY_HIGH;
    }
}
