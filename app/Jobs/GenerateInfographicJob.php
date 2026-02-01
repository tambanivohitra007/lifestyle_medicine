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
     */
    public function __construct(
        public InfographicGenerationRequest $request
    ) {}

    /**
     * Execute the job.
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
     * Get alt text for the generated image.
     */
    protected function getAltText(): string
    {
        $types = InfographicGenerationRequest::getTypes();
        $typeLabel = $types[$this->request->infographic_type] ?? 'Infographic';
        $conditionName = $this->request->condition->name ?? 'Health Condition';

        return "{$typeLabel} infographic for {$conditionName}";
    }

    /**
     * Get caption for the generated image.
     */
    protected function getCaption(): string
    {
        $types = InfographicGenerationRequest::getTypes();
        $typeLabel = $types[$this->request->infographic_type] ?? 'Infographic';

        return "AI-generated {$typeLabel}";
    }

    /**
     * Handle a job failure.
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
