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
 * Asynchronous job for converting approved AI drafts into structured JSON content.
 *
 * Processes structuring requests by calling AiContentService::structureContent()
 * with the condition name and approved draft text. Uses the Gemini "thinking" model
 * (System 2) for careful, deliberate JSON structuring.
 *
 * Configured with 3 retry attempts, 10-minute timeout (longer than draft generation
 * since structuring is more complex), and 30-second backoff between retries.
 *
 * @see \App\Services\AiContentService::structureContent() The service method this job calls
 * @see \App\Models\AiGenerationRequest The request model tracking job status
 * @see \App\Jobs\GenerateAiDraftJob The preceding job in the generation pipeline
 */
class StructureAiContentJob implements ShouldQueue
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
     * Set to 10 minutes (600s) since content structuring via the thinking model
     * is more time-intensive than draft generation.
     *
     * @var int
     */
    public int $timeout = 600;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public int $backoff = 30;

    /**
     * Create a new job instance.
     *
     * @param  AiGenerationRequest  $request  The generation request containing the approved draft in input_data
     */
    public function __construct(
        public AiGenerationRequest $request
    ) {}

    /**
     * Execute the job to structure approved draft content into JSON.
     *
     * Marks the request as processing, calls the AI service to convert the
     * human-readable draft into structured JSON, and updates the request status.
     * If the AI service returns an error and retries remain, the job is released
     * back to the queue.
     *
     * @param  AiContentService  $aiService  The AI content service (injected by the container)
     * @return void
     */
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
        Log::error('AI content structuring job failed permanently', [
            'request_id' => $this->request->id,
            'error' => $exception->getMessage(),
        ]);

        $this->request->markAsFailed('Content structuring failed. Please try again.');
    }
}
