<?php

namespace App\Services;

use App\Jobs\GenerateInfographicJob;
use App\Models\Condition;
use App\Models\InfographicGenerationRequest;
use Illuminate\Support\Facades\Log;

class InfographicGeneratorService
{
    protected ImagenService $imagenService;
    protected GeminiService $geminiService;

    // Inject GeminiService
    public function __construct(ImagenService $imagenService, GeminiService $geminiService)
    {
        $this->imagenService = $imagenService;
        $this->geminiService = $geminiService;
    }

    public function isAvailable(): bool
    {
        return $this->imagenService->isConfigured();
    }

    public function getStatus(): array
    {
        return $this->imagenService->getConfigurationStatus();
    }

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
     * Use Gemini to translate abstract medical topics into concrete visual descriptions
     * that contain NO TEXT.
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
     * Get a static fallback prompt when Gemini is unavailable.
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
