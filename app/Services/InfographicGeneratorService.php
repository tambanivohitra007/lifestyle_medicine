<?php

namespace App\Services;

use App\Jobs\GenerateInfographicJob;
use App\Models\Condition;
use App\Models\InfographicGenerationRequest;
use Illuminate\Support\Facades\Log;

class InfographicGeneratorService
{
    protected ImagenService $imagenService;

    public function __construct(ImagenService $imagenService)
    {
        $this->imagenService = $imagenService;
    }

    /**
     * Check if infographic generation is available.
     */
    public function isAvailable(): bool
    {
        return $this->imagenService->isConfigured();
    }

    /**
     * Get the configuration status.
     */
    public function getStatus(): array
    {
        return $this->imagenService->getConfigurationStatus();
    }

    /**
     * Queue infographic generation for a condition.
     *
     * @param Condition $condition The condition to generate infographics for
     * @param array $types The types of infographics to generate (default: all)
     * @return array{success: bool, requests?: array, error?: string}
     */
    public function queueGeneration(Condition $condition, array $types = []): array
    {
        if (!$this->isAvailable()) {
            return [
                'success' => false,
                'error' => 'Vertex AI Imagen is not configured.',
            ];
        }

        // Default to all types if none specified
        if (empty($types)) {
            $types = array_keys(InfographicGenerationRequest::getTypes());
        }

        $requests = [];

        foreach ($types as $type) {
            // Check if there's already a pending/processing request for this type
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

            // Build the prompt for this infographic type
            $prompt = $this->buildPrompt($condition, $type);

            // Create the generation request
            $request = InfographicGenerationRequest::create([
                'condition_id' => $condition->id,
                'infographic_type' => $type,
                'status' => InfographicGenerationRequest::STATUS_PENDING,
                'prompt' => $prompt,
                'generation_params' => [
                    'aspectRatio' => '3:4', // Portrait for infographics
                    'model' => $this->imagenService->getModel(),
                ],
            ]);

            // Dispatch the job
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
     */
    public function retryRequest(InfographicGenerationRequest $request): array
    {
        if (!$request->hasFailed()) {
            return [
                'success' => false,
                'error' => 'Only failed requests can be retried.',
            ];
        }

        $request->resetForRetry();

        GenerateInfographicJob::dispatch($request);

        return [
            'success' => true,
            'request' => $request->fresh(),
        ];
    }

    /**
     * Build an optimized prompt for a specific infographic type.
     */
    public function buildPrompt(Condition $condition, string $type): string
    {
        $conditionName = $condition->name;

        // Base style instructions for all infographics
        $styleInstructions = "Create a professional medical infographic. " .
            "Style: Clean, modern healthcare design with soft gradients, clear icons, and easy-to-read typography. " .
            "Color palette: Calming blues, greens, and warm accents. " .
            "Layout: Organized sections with visual hierarchy. " .
            "Do NOT include any text or words in the image - use only icons, symbols, and visual elements.";

        switch ($type) {
            case InfographicGenerationRequest::TYPE_OVERVIEW:
                return $this->buildOverviewPrompt($conditionName, $styleInstructions);

            case InfographicGenerationRequest::TYPE_RISK_FACTORS:
                return $this->buildRiskFactorsPrompt($conditionName, $styleInstructions);

            case InfographicGenerationRequest::TYPE_LIFESTYLE_SOLUTIONS:
                return $this->buildLifestyleSolutionsPrompt($conditionName, $styleInstructions);

            default:
                return $this->buildOverviewPrompt($conditionName, $styleInstructions);
        }
    }

    /**
     * Build prompt for condition overview infographic.
     */
    protected function buildOverviewPrompt(string $conditionName, string $styleInstructions): string
    {
        return "{$styleInstructions} " .
            "Topic: {$conditionName} health condition overview. " .
            "Visual elements to include: " .
            "- Central human body silhouette or organ illustration relevant to the condition " .
            "- Symptom icons arranged around the body " .
            "- Visual representation of affected body systems " .
            "- Simple prevalence/statistics visualization using icons " .
            "- Clear visual sections for different aspects of the condition";
    }

    /**
     * Build prompt for risk factors infographic.
     */
    protected function buildRiskFactorsPrompt(string $conditionName, string $styleInstructions): string
    {
        return "{$styleInstructions} " .
            "Topic: Risk factors for {$conditionName}. " .
            "Visual elements to include: " .
            "- Split layout: modifiable vs non-modifiable factors " .
            "- Lifestyle icons: diet, exercise, sleep, stress " .
            "- Genetic/hereditary symbols (DNA helix, family tree) " .
            "- Environmental factors icons " .
            "- Age and demographic representations " .
            "- Visual scale showing relative risk levels " .
            "- Arrows or connections showing factor relationships";
    }

    /**
     * Build prompt for lifestyle solutions infographic.
     */
    protected function buildLifestyleSolutionsPrompt(string $conditionName, string $styleInstructions): string
    {
        return "{$styleInstructions} " .
            "Topic: Lifestyle medicine solutions for {$conditionName}. " .
            "Visual elements to include: " .
            "- Hub and spoke layout with person at center " .
            "- NEWSTART health principles represented as icons: " .
            "  - Nutrition: fruits, vegetables, whole grains " .
            "  - Exercise: person in motion, walking, cycling " .
            "  - Water: water glass, hydration " .
            "  - Sunlight: sun rays, outdoor activities " .
            "  - Temperance: balance scale, moderation " .
            "  - Air: fresh air, breathing, nature " .
            "  - Rest: sleeping figure, relaxation " .
            "  - Trust: heart, peaceful imagery " .
            "- Visual connections between lifestyle factors and health improvement";
    }

    /**
     * Get all requests for a condition.
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
     * Get generation status for a condition.
     */
    public function getConditionStatus(Condition $condition): array
    {
        $requests = $condition->infographicRequests()
            ->with('media')
            ->get();

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

        $completedCount = $requests->where('status', InfographicGenerationRequest::STATUS_COMPLETED)->count();
        $failedCount = $requests->where('status', InfographicGenerationRequest::STATUS_FAILED)->count();

        return [
            'types' => $byType,
            'summary' => [
                'pending' => $pendingCount,
                'completed' => $completedCount,
                'failed' => $failedCount,
                'total' => count(InfographicGenerationRequest::getTypes()),
            ],
            'is_generating' => $pendingCount > 0,
        ];
    }
}
