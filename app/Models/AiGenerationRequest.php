<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a request for AI-generated content via Google Gemini.
 *
 * AI generation requests track the lifecycle of content generation jobs, from
 * initial request through processing to completion or failure. They store both
 * the input parameters and output data, along with status tracking and error
 * handling for retry logic.
 *
 * @property string $id UUID primary key
 * @property string $type The type of content generation requested
 * @property string|null $condition_name The condition name for which content is being generated
 * @property string $status Request status (pending, processing, completed, failed)
 * @property array|null $input_data Input parameters for the generation request
 * @property array|null $output_data Generated output data (when completed)
 * @property string|null $error_message Error message (when failed)
 * @property int|null $requested_by ID of the user who requested generation
 * @property int $attempts Number of processing attempts
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read User|null $requester
 */
class AiGenerationRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'type',
        'condition_name',
        'status',
        'input_data',
        'output_data',
        'error_message',
        'requested_by',
        'attempts',
    ];

    protected $casts = [
        'input_data' => 'array',
        'output_data' => 'array',
        'attempts' => 'integer',
    ];

    /**
     * Get the user who requested this generation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Mark the request as currently processing and increment the attempt counter.
     *
     * @return void
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'status' => 'processing',
            'attempts' => $this->attempts + 1,
        ]);
    }

    /**
     * Mark the request as successfully completed with the given output data.
     *
     * @param  array  $outputData The generated content data
     * @return void
     */
    public function markAsCompleted(array $outputData): void
    {
        $this->update([
            'status' => 'completed',
            'output_data' => $outputData,
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
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}
