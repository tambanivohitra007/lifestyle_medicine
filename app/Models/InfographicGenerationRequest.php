<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InfographicGenerationRequest extends Model
{
    use HasUuids, SoftDeletes, HasAuditFields;

    public const TYPE_OVERVIEW = 'overview';
    public const TYPE_RISK_FACTORS = 'risk_factors';
    public const TYPE_LIFESTYLE_SOLUTIONS = 'lifestyle_solutions';

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'condition_id',
        'infographic_type',
        'status',
        'prompt',
        'generation_params',
        'media_id',
        'error_message',
        'attempts',
    ];

    protected $casts = [
        'generation_params' => 'array',
        'attempts' => 'integer',
    ];

    /**
     * Get the condition this request belongs to.
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Get the generated media.
     */
    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    /**
     * Get all available infographic types.
     */
    public static function getTypes(): array
    {
        return [
            self::TYPE_OVERVIEW => 'Condition Overview',
            self::TYPE_RISK_FACTORS => 'Risk Factors',
            self::TYPE_LIFESTYLE_SOLUTIONS => 'Lifestyle Solutions',
        ];
    }

    /**
     * Get all available statuses.
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',
            self::STATUS_PROCESSING => 'Processing',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_FAILED => 'Failed',
        ];
    }

    /**
     * Check if the request is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if the request is processing.
     */
    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    /**
     * Check if the request is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if the request has failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Mark the request as processing.
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSING,
            'attempts' => $this->attempts + 1,
        ]);
    }

    /**
     * Mark the request as completed.
     */
    public function markAsCompleted(string $mediaId): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'media_id' => $mediaId,
            'error_message' => null,
        ]);
    }

    /**
     * Mark the request as failed.
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Reset the request for retry.
     */
    public function resetForRetry(): void
    {
        $this->update([
            'status' => self::STATUS_PENDING,
            'error_message' => null,
        ]);
    }
}
