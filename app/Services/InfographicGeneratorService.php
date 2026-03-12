<?php

namespace App\Services;

use App\Jobs\GenerateInfographicJob;
use App\Models\Condition;
use App\Models\InfographicGenerationRequest;
use Illuminate\Support\Facades\Log;

/**
 * Infographic creation orchestration service.
 *
 * Coordinates the two-step infographic generation pipeline for health conditions:
 * 1. **Architect Step** (Gemini): Translates abstract medical topics into concrete visual
 *    descriptions optimized for AI image generators, with strict "no text in image" rules.
 * 2. **Generation Step** (Imagen via Job): Dispatches async jobs to generate images from
 *    the architected prompts using Vertex AI Imagen.
 *
 * Supports three infographic types per condition: overview, risk factors, and lifestyle solutions.
 * Falls back to static prompts when Gemini is unavailable.
 *
 * @see \App\Services\GeminiService Used for the "Architect" step (prompt generation)
 * @see \App\Services\ImagenService Used for actual image generation
 * @see \App\Jobs\GenerateInfographicJob The async job dispatched for each infographic
 * @see \App\Models\InfographicGenerationRequest Tracks the status of each generation request
 */
class InfographicGeneratorService
{
    /** @var ImagenService The Vertex AI Imagen service for image generation */
    protected ImagenService $imagenService;

    /** @var GeminiService The Gemini service for architecting visual prompts */
    protected GeminiService $geminiService;

    /**
     * Create a new InfographicGeneratorService instance.
     *
     * @param  ImagenService  $imagenService  The image generation service
     * @param  GeminiService  $geminiService  The text generation service for prompt architecture
     */
    public function __construct(ImagenService $imagenService, GeminiService $geminiService)
    {
        $this->imagenService = $imagenService;
        $this->geminiService = $geminiService;
    }

    /**
     * Check if the infographic generation service is available.
     *
     * Delegates to ImagenService to verify Vertex AI configuration.
     *
     * @return bool True if Vertex AI Imagen is properly configured
     */
    public function isAvailable(): bool
    {
        return $this->imagenService->isConfigured();
    }

    /**
     * Get the current configuration status of the Imagen service.
     *
     * @return array Configuration status details (project ID masked)
     */
    public function getStatus(): array
    {
        return $this->imagenService->getConfigurationStatus();
    }

    /**
     * Queue infographic generation jobs for a condition.
     *
     * For each requested infographic type, this method:
     * 1. Checks for existing pending/processing requests (skips if found)
     * 2. Uses Gemini to architect a visual prompt (falls back to static prompts)
     * 3. Creates an InfographicGenerationRequest record
     * 4. Dispatches a GenerateInfographicJob to the queue
     *
     * @param  Condition  $condition  The health condition to generate infographics for
     * @param  array  $types  Infographic types to generate; defaults to all available types
     * @return array{success: bool, requests?: array, error?: string} The created/existing request records
     */
    public function queueGeneration(Condition $condition, array $types = []): array
    {
        if (!$this->isAvailable()) {
            return [
                'success' => false,
                'error' => 'Vertex AI Imagen is not configured.',
            ];
        }

        if (empty($types)) {
            $types = array_keys(InfographicGenerationRequest::getTypes());
        }

        $requests = [];

        foreach ($types as $type) {
            // Check for existing requests
            $existingRequest = InfographicGenerationRequest::where('condition_id', $condition->id)
                ->where('infographic_type', $type)
                ->whereIn('status', [
                    InfographicGenerationRequest::STATUS_PENDING,
                    InfographicGenerationRequest::STATUS_PROCESSING,
                ])
                ->first();

            if ($existingRequest) {
                $requests[] = $existingRequest;
                continue;
            }

            // ============================================================
            // STEP 1: THE ARCHITECT (Use Gemini to describe the image)
            // architectVisualPrompt handles errors internally and returns fallback
            // ============================================================
            $visualPrompt = $this->architectVisualPrompt($condition, $type);

            // ============================================================
            // STEP 2: CREATE REQUEST (To be picked up by Job)
            // ============================================================
            $request = InfographicGenerationRequest::create([
                'condition_id' => $condition->id,
                'infographic_type' => $type,
                'status' => InfographicGenerationRequest::STATUS_PENDING,
                'prompt' => $visualPrompt,
                'generation_params' => [
                    'aspectRatio' => '3:4',
                    'model' => $this->imagenService->getModel(),
                    'sampleCount' => 1,
                ],
            ]);

            GenerateInfographicJob::dispatch($request);
            $requests[] = $request;
        }

        return [
            'success' => true,
            'requests' => $requests,
        ];
    }

    /**
     * Retry a failed infographic generation request.
     *
     * Re-architects the visual prompt using Gemini (keeps existing prompt if Gemini fails),
     * resets the request status, and dispatches a new GenerateInfographicJob.
     *
     * @param  InfographicGenerationRequest  $request  The failed request to retry
     * @return array{success: bool, request?: InfographicGenerationRequest, error?: string}
     */
    public function retryRequest(InfographicGenerationRequest $request): array
    {
        if (!$request->hasFailed()) {
            return ['success' => false, 'error' => 'Only failed requests can be retried.'];
        }

        // Load the condition relationship if not already loaded
        if (!$request->relationLoaded('condition')) {
            $request->load('condition');
        }

        // Ensure condition exists
        if (!$request->condition) {
            return ['success' => false, 'error' => 'The associated condition no longer exists.'];
        }

        // Try to re-architect the prompt on retry for a fresh attempt
        try {
            $request->prompt = $this->architectVisualPrompt($request->condition, $request->infographic_type);
        } catch (\Exception $e) {
            Log::error("Failed to re-architect prompt for retry: " . $e->getMessage());
            // Keep the existing prompt if Gemini fails
        }

        $request->resetForRetry();
        $request->save();

        GenerateInfographicJob::dispatch($request);

        return [
            'success' => true,
            'request' => $request->fresh(),
        ];
    }

    /**
     * Use Gemini to translate abstract medical topics into concrete visual descriptions.
     *
     * Acts as the "Architect" step: instructs Gemini (as a Medical Illustrator & Prompt Engineer)
     * to create descriptive prompts optimized for AI image generators. The prompts strictly
     * prohibit text/labels in the output image, and specify clean flat vector art style with
     * medical color palettes.
     *
     * Falls back to static prompts if Gemini is not configured or returns an invalid response.
     *
     * @param  Condition  $condition  The health condition to create a visual prompt for
     * @param  string  $type  The infographic type (overview, risk_factors, or lifestyle_solutions)
     * @return string The visual description prompt for the image generator
     */
    protected function architectVisualPrompt(Condition $condition, string $type): string
    {
        $conditionName = $condition->name;

        // If Gemini isn't configured, use static fallback prompts
        if (!$this->geminiService->isConfigured()) {
            return $this->getStaticFallbackPrompt($conditionName, $type);
        }

        // System Instruction: Strong rules against generating text
        $systemInstruction = <<<EOT
            You are an expert Medical Illustrator and Prompt Engineer for AI Image Generators.
            Your goal is to write a descriptive prompt for an image generator (like Imagen or DALL-E) to create a background for a medical infographic.

            CRITICAL RULES:
            1. NO TEXT: The output image must NOT contain any letters, words, labels, or numbers. The Image AI cannot spell.
            2. VISUALS ONLY: Describe specific icons, symbols, shapes, layouts, and colors.
            3. STYLE: Clean, modern, flat vector art style. Soft medical colors (blues, teals, soft greens). White or light background.
            4. OUTPUT: Return ONLY the prompt string. Do not include "Here is the prompt:" or any markdown.
            EOT;

        // Specific task based on the infographic type
        $userTask = match ($type) {
            InfographicGenerationRequest::TYPE_OVERVIEW =>
                "Create a prompt for an overview illustration of '{$conditionName}'. Describe a central, clean anatomical diagram or silhouette relevant to the condition. Surround it with 3-4 abstract bubbles or icons representing symptoms (e.g., lightning for pain, thermometer for fever). NO TEXT.",

            InfographicGenerationRequest::TYPE_RISK_FACTORS =>
                "Create a prompt for a 'Risk Factors' visualization for '{$conditionName}'. Describe a split composition. On one side, describe icons representing lifestyle risks (like unhealthy food, sedentary chair, or smoke). On the other side, describe icons for biological risks (like DNA helix or a clock for age). Use color coding (e.g., orange vs blue) to separate them. NO TEXT.",

            InfographicGenerationRequest::TYPE_LIFESTYLE_SOLUTIONS =>
                "Create a prompt for a 'Lifestyle Solutions' visualization for '{$conditionName}'. Describe a central circular layout. In the center, a happy/healthy human silhouette. Around it, arrange distinct circular icons representing: Water (droplet), Rest (moon/bed), Exercise (running figure), and Nutrition (leaf/apple). Connect them with soft lines. NO TEXT.",

            default => "Create a prompt for a generic, clean medical background illustration suitable for '{$conditionName}'. NO TEXT.",
        };

        // Call Gemini to architect the prompt
        try {
            $result = $this->geminiService->generateText($systemInstruction, $userTask);

            // Validate that Gemini returned an actual image prompt, not the task instruction
            if (empty($result) || str_starts_with($result, 'Create a prompt for')) {
                Log::warning("Gemini returned invalid prompt for {$type}, using static fallback");
                return $this->getStaticFallbackPrompt($conditionName, $type);
            }

            return $result;
        } catch (\Exception $e) {
            Log::warning("Gemini prompt generation failed for {$type}: " . $e->getMessage());
            return $this->getStaticFallbackPrompt($conditionName, $type);
        }
    }

    /**
     * Get a static fallback prompt when Gemini is unavailable or returns invalid output.
     *
     * Provides pre-written visual prompts for each infographic type with a consistent
     * base style: professional medical infographic, clean vector art, soft gradient colors,
     * no text, white background.
     *
     * @param  string  $conditionName  The health condition name to include in the prompt
     * @param  string  $type  The infographic type (overview, risk_factors, or lifestyle_solutions)
     * @return string The static visual prompt for the image generator
     */
    protected function getStaticFallbackPrompt(string $conditionName, string $type): string
    {
        $baseStyle = "Professional medical infographic, clean modern healthcare design, soft gradient blues and greens, clear icons, no text or words, white background, vector art style.";

        return match ($type) {
            InfographicGenerationRequest::TYPE_OVERVIEW =>
                "{$baseStyle} Central human body silhouette with symptom icons arranged around it, representing {$conditionName}. Abstract bubbles showing affected body systems.",

            InfographicGenerationRequest::TYPE_RISK_FACTORS =>
                "{$baseStyle} Split composition showing risk factors for {$conditionName}. Left side: lifestyle icons (food, chair, clock). Right side: biological icons (DNA helix, family tree). Orange and blue color coding.",

            InfographicGenerationRequest::TYPE_LIFESTYLE_SOLUTIONS =>
                "{$baseStyle} Circular hub-and-spoke layout for {$conditionName} lifestyle solutions. Center: healthy person silhouette. Surrounding icons: water droplet, moon for rest, running figure, apple and leaf for nutrition. Soft connecting lines.",

            default => "{$baseStyle} Clean medical illustration representing {$conditionName} health condition.",
        };
    }

    /**
     * Get the latest infographic generation request for each type for a condition.
     *
     * Returns requests grouped by infographic type, keeping only the most recent
     * request per type. Includes associated media records.
     *
     * @param  Condition  $condition  The condition to get requests for
     * @return array Requests grouped by infographic type (latest per type)
     */
    public function getRequestsForCondition(Condition $condition): array
    {
        return $condition->infographicRequests()
            ->with('media')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('infographic_type')
            ->map(fn($requests) => $requests->first())
            ->toArray();
    }

    /**
     * Get a comprehensive status summary of infographic generation for a condition.
     *
     * Returns status for each infographic type (with label, request, status, and media),
     * plus aggregate counts of pending, completed, and failed requests.
     *
     * @param  Condition  $condition  The condition to check status for
     * @return array{types: array, summary: array{pending: int, completed: int, failed: int, total: int}, is_generating: bool}
     */
    public function getConditionStatus(Condition $condition): array
    {
        $requests = $condition->infographicRequests()->with('media')->get();
        $byType = [];

        foreach (InfographicGenerationRequest::getTypes() as $type => $label) {
            $request = $requests->where('infographic_type', $type)->sortByDesc('created_at')->first();
            $byType[$type] = [
                'label' => $label,
                'request' => $request,
                'status' => $request?->status ?? 'not_started',
                'media' => $request?->media,
            ];
        }

        $pendingCount = $requests->whereIn('status', [
            InfographicGenerationRequest::STATUS_PENDING,
            InfographicGenerationRequest::STATUS_PROCESSING,
        ])->count();

        return [
            'types' => $byType,
            'summary' => [
                'pending' => $pendingCount,
                'completed' => $requests->where('status', InfographicGenerationRequest::STATUS_COMPLETED)->count(),
                'failed' => $requests->where('status', InfographicGenerationRequest::STATUS_FAILED)->count(),
                'total' => count(InfographicGenerationRequest::getTypes()),
            ],
            'is_generating' => $pendingCount > 0,
        ];
    }
}
