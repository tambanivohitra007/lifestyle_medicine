<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function markAsProcessing(): void
    {
        $this->update([
            'status' => 'processing',
            'attempts' => $this->attempts + 1,
        ]);
    }

    public function markAsCompleted(array $outputData): void
    {
        $this->update([
            'status' => 'completed',
            'output_data' => $outputData,
            'error_message' => null,
        ]);
    }

    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}
