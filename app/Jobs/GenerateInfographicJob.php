<?php

namespace App\Jobs;

use App\Models\InfographicGenerationRequest;
use App\Models\Media;
use App\Services\ImagenService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Asynchronous job for generating medical infographic images via Vertex AI Imagen.
 *
 * Processes infographic generation requests dispatched by InfographicGeneratorService.
 * For each request, this job:
 * 1. Generates an image from the pre-architected prompt using ImagenService
 * 2. Saves the base64-encoded image to public storage under infographics/{condition_id}/
 * 3. Creates a Media record linking the image to the condition
 * 4. Updates the InfographicGenerationRequest with completion or failure status
 *
 * Configured with 3 retry attempts, 2-minute timeout, and 30-second backoff.
 *
 * @see \App\Services\InfographicGeneratorService The orchestrator that dispatches this job
 * @see \App\Services\ImagenService The image generation service this job calls
 * @see \App\Models\InfographicGenerationRequest The request model tracking job status
 * @see \App\Models\Media The polymorphic media model for storing generated images
 */
class GenerateInfographicJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 120;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 30;

    /**
     * Create a new job instance.
     *
     * @param  InfographicGenerationRequest  $request  The generation request containing the prompt and parameters
     */
    public function __construct(
        public InfographicGenerationRequest $request
    ) {}

    /**
     * Execute the job to generate an infographic image.
     *
     * Calls ImagenService to generate the image, saves it to storage, creates a Media
     * record, and updates the request status. On failure with remaining retries, the
     * job is released back to the queue with a 30-second backoff.
     *
     * @param  ImagenService  $imagenService  The Imagen service (injected by the container)
     * @return void
     *
     * @throws \Exception When image generation or storage fails (caught internally for retry logic)
     */
    public function handle(ImagenService $imagenService): void
    {
        Log::info('Starting infographic generation', [
            'request_id' => $this->request->id,
            'condition_id' => $this->request->condition_id,
            'type' => $this->request->infographic_type,
        ]);

        // Mark as processing
        $this->request->markAsProcessing();

        try {
            // Generate the image
            $result = $imagenService->generateImage(
                $this->request->prompt,
                $this->request->generation_params ?? []
            );

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'Unknown error during image generation');
            }

            // Save the image to storage
            $filename = sprintf(
                '%s_%s_%s',
                Str::slug($this->request->condition->name),
                $this->request->infographic_type,
                Str::random(8)
            );

            $saveResult = $imagenService->saveImage(
                $result['image_data'],
                $filename,
                'infographics/' . $this->request->condition_id
            );

            if (!$saveResult['success']) {
                throw new \Exception($saveResult['error'] ?? 'Failed to save image');
            }

            // Create media record
            $media = Media::create([
                'mediable_type' => 'App\Models\Condition',
                'mediable_id' => $this->request->condition_id,
                'filename' => $saveResult['filename'],
                'original_filename' => $saveResult['filename'],
                'mime_type' => $saveResult['mime_type'] ?? 'image/png',
                'size' => $saveResult['size'],
                'disk' => 'public',
                'path' => $saveResult['path'],
                'type' => 'infographic',
                'alt_text' => $this->getAltText(),
                'caption' => $this->getCaption(),
            ]);

            // Mark as completed
            $this->request->markAsCompleted($media->id);

            Log::info('Infographic generation completed', [
                'request_id' => $this->request->id,
                'media_id' => $media->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Infographic generation failed', [
                'request_id' => $this->request->id,
                'error' => $e->getMessage(),
                'attempts' => $this->request->attempts,
            ]);

            // If we've exhausted retries, mark as failed
            if ($this->attempts() >= $this->tries) {
                $this->request->markAsFailed($e->getMessage());
            } else {
                // Release the job for retry
                $this->release($this->backoff);
            }
        }
    }

    /**
     * Get accessibility alt text for the generated infographic image.
     *
     * Constructs a descriptive alt text combining the infographic type label
     * and condition name (e.g., "Overview infographic for Hypertension").
     *
     * @return string The alt text string
     */
    protected function getAltText(): string
    {
        $types = InfographicGenerationRequest::getTypes();
        $typeLabel = $types[$this->request->infographic_type] ?? 'Infographic';
        $conditionName = $this->request->condition->name ?? 'Health Condition';

        return "{$typeLabel} infographic for {$conditionName}";
    }

    /**
     * Get a display caption for the generated infographic image.
     *
     * @return string The caption string (e.g., "AI-generated Overview")
     */
    protected function getCaption(): string
    {
        $types = InfographicGenerationRequest::getTypes();
        $typeLabel = $types[$this->request->infographic_type] ?? 'Infographic';

        return "AI-generated {$typeLabel}";
    }

    /**
     * Handle a permanent job failure after all retry attempts are exhausted.
     *
     * Called by the queue worker when the job has failed on all attempts.
     * Marks the InfographicGenerationRequest as failed with the exception message.
     *
     * @param  \Throwable  $exception  The exception that caused the final failure
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Infographic generation job failed permanently', [
            'request_id' => $this->request->id,
            'error' => $exception->getMessage(),
        ]);

        $this->request->markAsFailed($exception->getMessage());
    }
}
