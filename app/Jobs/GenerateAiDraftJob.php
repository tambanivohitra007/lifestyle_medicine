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

/**
 * Asynchronous job for generating AI content drafts via the queue.
 *
 * Processes draft generation requests by calling AiContentService::generateDraft()
 * with the condition name and optional context. Updates the AiGenerationRequest
 * record with processing status, completion results, or failure messages.
 *
 * Configured with 3 retry attempts, 5-minute timeout, and 30-second backoff between retries.
 * On transient failures (before max retries), the job is released back to the queue.
 * On permanent failure, the request is marked as failed with an error message.
 *
 * @see \App\Services\AiContentService::generateDraft() The service method this job calls
 * @see \App\Models\AiGenerationRequest The request model tracking job status
 */
class GenerateAiDraftJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public int $timeout = 300;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public int $backoff = 30;

    /**
     * Create a new job instance.
     *
     * @param  AiGenerationRequest  $request  The generation request containing condition name and input data
     */
    public function __construct(
        public AiGenerationRequest $request
    ) {}

    /**
     * Execute the job to generate an AI content draft.
     *
     * Marks the request as processing, calls the AI service for draft generation,
     * and updates the request status based on the result. If the AI service returns
     * an error and retries remain, the job is released back to the queue.
     *
     * @param  AiContentService  $aiService  The AI content service (injected by the container)
     * @return void
     */
    public function handle(AiContentService $aiService): void
    {
        Log::info('Starting AI draft generation', [
            'request_id' => $this->request->id,
            'condition_name' => $this->request->condition_name,
        ]);

        $this->request->markAsProcessing();

        $inputData = $this->request->input_data ?? [];
        $result = $aiService->generateDraft(
            $this->request->condition_name,
            $inputData['context'] ?? ''
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

        Log::info('AI draft generation completed', [
            'request_id' => $this->request->id,
        ]);
    }

    /**
     * Handle a permanent job failure after all retry attempts are exhausted.
     *
     * Called by the queue worker when the job has failed on all attempts.
     * Marks the AiGenerationRequest as failed with a user-friendly error message.
     *
     * @param  \Throwable  $exception  The exception that caused the final failure
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('AI draft generation job failed permanently', [
            'request_id' => $this->request->id,
            'error' => $exception->getMessage(),
        ]);

        $this->request->markAsFailed('Draft generation failed. Please try again.');
    }
}
