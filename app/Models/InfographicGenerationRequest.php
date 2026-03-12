<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a request to generate an infographic via Vertex AI Imagen.
 *
 * Infographic generation requests track the lifecycle of image generation for
 * conditions, from initial prompt creation through processing to completed media
 * attachment. Supports different infographic types (overview, risk factors,
 * lifestyle solutions) and includes retry logic with attempt tracking.
 *
 * @property string $id UUID primary key
 * @property string $condition_id Foreign key to the condition
 * @property string $infographic_type Type of infographic (overview, risk_factors, lifestyle_solutions)
 * @property string $status Request status (pending, processing, completed, failed)
 * @property string|null $prompt The generation prompt sent to the AI
 * @property array|null $generation_params Additional parameters for image generation
 * @property string|null $media_id Foreign key to the generated media (when completed)
 * @property string|null $error_message Error message (when failed)
 * @property int $attempts Number of processing attempts
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read Condition $condition
 * @property-read Media|null $media
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Get the generated media.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Media, $this>
     */
    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    /**
     * Get all available infographic types.
     *
     * @return array<string, string> Map of type constant to display label
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
     *
     * @return array<string, string> Map of status constant to display label
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
     *
     * @return bool
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if the request is processing.
     *
     * @return bool
     */
    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    /**
     * Check if the request is completed.
     *
     * @return bool
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if the request has failed.
     *
     * @return bool
     */
    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Mark the request as processing and increment the attempt counter.
     *
     * @return void
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSING,
            'attempts' => $this->attempts + 1,
        ]);
    }

    /**
     * Mark the request as completed with the generated media ID.
     *
     * @param  string  $mediaId UUID of the generated media record
     * @return void
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
     * Mark the request as failed with the given error message.
     *
     * @param  string  $errorMessage Description of the failure
     * @return void
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Reset the request for retry by setting status back to pending.
     *
     * @return void
     */
    public function resetForRetry(): void
    {
        $this->update([
            'status' => self::STATUS_PENDING,
            'error_message' => null,
        ]);
    }
}
