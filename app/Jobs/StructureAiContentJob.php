<?php

namespace App\Jobs;

use App\Models\AiGenerationRequest;
use App\Services\AiContentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class StructureAiContentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 600;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 30;

    public function __construct(
        public AiGenerationRequest $request
    ) {}

    public function handle(AiContentService $aiService): void
    {
        Log::info('Starting AI content structuring', [
            'request_id' => $this->request->id,
            'condition_name' => $this->request->condition_name,
        ]);

        $this->request->markAsProcessing();

        $inputData = $this->request->input_data ?? [];
        $result = $aiService->structureContent(
            $this->request->condition_name,
            $inputData['approved_draft'] ?? ''
        );

        if (isset($result['error'])) {
            if ($this->attempts() >= $this->tries) {
                $this->request->markAsFailed($result['error']);
            } else {
                $this->release($this->backoff);
            }

            return;
        }

        $this->request->markAsCompleted($result);

        Log::info('AI content structuring completed', [
            'request_id' => $this->request->id,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('AI content structuring job failed permanently', [
            'request_id' => $this->request->id,
            'error' => $exception->getMessage(),
        ]);

        $this->request->markAsFailed('Content structuring failed. Please try again.');
    }
}
