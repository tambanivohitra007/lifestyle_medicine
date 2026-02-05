<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

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
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Get all available risk types.
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
     * Check if the risk factor is modifiable.
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
     */
    public function isHighSeverity(): bool
    {
        return $this->severity === self::SEVERITY_HIGH;
    }
}
