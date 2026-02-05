<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConditionComplicationResource;
use App\Http\Resources\ConditionRiskFactorResource;
use App\Models\Condition;
use App\Models\ConditionComplication;
use App\Models\ConditionRiskFactor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ConditionMindmapController extends Controller
{
    /**
     * Branch colors for mindmap visualization.
     */
    protected const BRANCH_COLORS = [
        'riskFactors' => '#f97316',      // Orange
        'complications' => '#dc2626',     // Red
        'nutrition' => '#f59e0b',         // Amber
        'exercise' => '#22c55e',          // Green
        'hydrotherapy' => '#06b6d4',      // Cyan
        'spiritual-care' => '#6366f1',    // Indigo
        'mental-health' => '#14b8a6',     // Teal
        'stress-management' => '#a855f7', // Purple
        'pharmacotherapy' => '#64748b',   // Slate
        'natural-remedies' => '#10b981',  // Emerald
    ];

    /**
     * Severity colors for risk factors.
     */
    protected const SEVERITY_COLORS = [
        'high' => '#dc2626',
        'moderate' => '#f59e0b',
        'low' => '#22c55e',
    ];

    /**
     * Likelihood colors for complications.
     */
    protected const LIKELIHOOD_COLORS = [
        'common' => '#dc2626',
        'occasional' => '#f59e0b',
        'rare' => '#22c55e',
    ];

    /**
     * Get the complete mindmap data for a condition.
     */
    public function show(Condition $condition): JsonResponse
    {
        // Load all relationships needed for the mindmap
        $condition->load([
            'riskFactors' => fn($q) => $q->orderBy('severity', 'desc')->orderBy('order_index'),
            'complications.complicationCondition',
            'interventions.careDomain',
            'interventions.recipes',
            'interventions.scriptures',
            'interventions.egwReferences',
            'interventions.evidenceEntries',
            'scriptures',
            'recipes',
            'egwReferences',
        ]);

        // Group interventions by care domain
        $solutionsByDomain = $this->groupInterventionsByDomain($condition);

        // Build the response
        return response()->json([
            'condition' => [
                'id' => $condition->id,
                'name' => $condition->name,
                'category' => $condition->category,
                'summary' => $condition->summary,
            ],
            'branches' => [
                'riskFactors' => $this->formatRiskFactors($condition->riskFactors),
                'complications' => $this->formatComplications($condition->complications),
                'solutions' => $solutionsByDomain,
            ],
            'meta' => [
                'totalRiskFactors' => $condition->riskFactors->count(),
                'totalComplications' => $condition->complications->count(),
                'totalInterventions' => $condition->interventions->count(),
                'totalRecipes' => $this->countUniqueRecipes($condition, $solutionsByDomain),
                'totalScriptures' => $this->countUniqueScriptures($condition, $solutionsByDomain),
                'totalEgwReferences' => $this->countUniqueEgwReferences($condition, $solutionsByDomain),
                'branchColors' => self::BRANCH_COLORS,
            ],
        ]);
    }

    /**
     * Format risk factors for the mindmap.
     */
    protected function formatRiskFactors($riskFactors): array
    {
        return $riskFactors->map(function ($rf) {
            return [
                'id' => $rf->id,
                'name' => $rf->name,
                'description' => $rf->description,
                'riskType' => $rf->risk_type,
                'riskTypeLabel' => ConditionRiskFactor::getRiskTypes()[$rf->risk_type] ?? $rf->risk_type,
                'severity' => $rf->severity,
                'severityColor' => self::SEVERITY_COLORS[$rf->severity] ?? '#9ca3af',
                'isModifiable' => $rf->isModifiable(),
            ];
        })->toArray();
    }

    /**
     * Format complications for the mindmap.
     */
    protected function formatComplications($complications): array
    {
        return $complications->map(function ($comp) {
            return [
                'id' => $comp->id,
                'name' => $comp->name,
                'description' => $comp->description,
                'likelihood' => $comp->likelihood,
                'likelihoodLabel' => ConditionComplication::getLikelihoodLevels()[$comp->likelihood] ?? $comp->likelihood,
                'likelihoodColor' => self::LIKELIHOOD_COLORS[$comp->likelihood] ?? '#9ca3af',
                'timeframe' => $comp->timeframe,
                'preventable' => $comp->preventable,
                'linkedConditionId' => $comp->complication_condition_id,
                'linkedCondition' => $comp->complicationCondition ? [
                    'id' => $comp->complicationCondition->id,
                    'name' => $comp->complicationCondition->name,
                ] : null,
            ];
        })->toArray();
    }

    /**
     * Group interventions by care domain for solutions branch.
     */
    protected function groupInterventionsByDomain(Condition $condition): array
    {
        $grouped = [];

        foreach ($condition->interventions as $intervention) {
            $domain = $intervention->careDomain;
            $domainSlug = $domain ? strtolower(str_replace(' ', '-', $domain->name)) : 'other';
            $domainId = $domain?->id ?? 'other';

            if (!isset($grouped[$domainSlug])) {
                $grouped[$domainSlug] = [
                    'careDomain' => $domain ? [
                        'id' => $domain->id,
                        'name' => $domain->name,
                        'icon' => $domain->icon,
                        'color' => self::BRANCH_COLORS[$domainSlug] ?? '#6b7280',
                    ] : [
                        'id' => 'other',
                        'name' => 'Other',
                        'icon' => 'circle',
                        'color' => '#6b7280',
                    ],
                    'interventions' => [],
                    'scriptures' => [],
                    'egwReferences' => [],
                ];
            }

            // Add intervention with its linked content
            $interventionData = [
                'id' => $intervention->id,
                'name' => $intervention->name,
                'description' => $intervention->description,
                'mechanism' => $intervention->mechanism,
                'strengthOfEvidence' => $intervention->pivot->strength_of_evidence ?? 'emerging',
                'recommendationLevel' => $intervention->pivot->recommendation_level ?? 'optional',
                'clinicalNotes' => $intervention->pivot->clinical_notes,
                'recipes' => $intervention->recipes->map(fn($r) => [
                    'id' => $r->id,
                    'title' => $r->title,
                    'description' => $r->description,
                    'dietaryTags' => $r->dietary_tags,
                    'relevanceNote' => $r->pivot->relevance_note ?? null,
                ])->toArray(),
                'evidenceCount' => $intervention->evidenceEntries->count(),
            ];

            $grouped[$domainSlug]['interventions'][] = $interventionData;

            // Collect scriptures linked to this intervention
            foreach ($intervention->scriptures as $scripture) {
                $grouped[$domainSlug]['scriptures'][$scripture->id] = [
                    'id' => $scripture->id,
                    'reference' => $scripture->reference,
                    'text' => $scripture->text,
                    'theme' => $scripture->theme,
                ];
            }

            // Collect EGW references linked to this intervention
            foreach ($intervention->egwReferences as $egwRef) {
                $grouped[$domainSlug]['egwReferences'][$egwRef->id] = [
                    'id' => $egwRef->id,
                    'citation' => $egwRef->citation,
                    'quote' => $egwRef->quote,
                    'topic' => $egwRef->topic,
                    'book' => $egwRef->book,
                ];
            }
        }

        // Add condition-level scriptures to spiritual care branch
        $spiritualSlug = 'spiritual-care';
        if (!isset($grouped[$spiritualSlug])) {
            $spiritualDomain = \App\Models\CareDomain::where('name', 'like', '%spiritual%')->first();
            $grouped[$spiritualSlug] = [
                'careDomain' => $spiritualDomain ? [
                    'id' => $spiritualDomain->id,
                    'name' => $spiritualDomain->name,
                    'icon' => $spiritualDomain->icon ?? 'book-heart',
                    'color' => self::BRANCH_COLORS[$spiritualSlug],
                ] : [
                    'id' => 'spiritual-care',
                    'name' => 'Spiritual Care',
                    'icon' => 'book-heart',
                    'color' => self::BRANCH_COLORS[$spiritualSlug],
                ],
                'interventions' => [],
                'scriptures' => [],
                'egwReferences' => [],
            ];
        }

        // Add condition-level scriptures
        foreach ($condition->scriptures as $scripture) {
            $grouped[$spiritualSlug]['scriptures'][$scripture->id] = [
                'id' => $scripture->id,
                'reference' => $scripture->reference,
                'text' => $scripture->text,
                'theme' => $scripture->theme,
            ];
        }

        // Add condition-level EGW references
        foreach ($condition->egwReferences as $egwRef) {
            $grouped[$spiritualSlug]['egwReferences'][$egwRef->id] = [
                'id' => $egwRef->id,
                'citation' => $egwRef->citation,
                'quote' => $egwRef->quote,
                'topic' => $egwRef->topic,
                'book' => $egwRef->book,
            ];
        }

        // Convert associative arrays to indexed arrays for scriptures/egwReferences
        foreach ($grouped as &$branch) {
            $branch['scriptures'] = array_values($branch['scriptures']);
            $branch['egwReferences'] = array_values($branch['egwReferences']);
        }

        return $grouped;
    }

    /**
     * Count unique recipes across all branches.
     */
    protected function countUniqueRecipes(Condition $condition, array $solutions): int
    {
        $recipeIds = [];
        foreach ($solutions as $branch) {
            foreach ($branch['interventions'] as $intervention) {
                foreach ($intervention['recipes'] as $recipe) {
                    $recipeIds[$recipe['id']] = true;
                }
            }
        }
        // Also count condition-level recipes
        foreach ($condition->recipes as $recipe) {
            $recipeIds[$recipe->id] = true;
        }
        return count($recipeIds);
    }

    /**
     * Count unique scriptures across all branches.
     */
    protected function countUniqueScriptures(Condition $condition, array $solutions): int
    {
        $scriptureIds = [];
        foreach ($solutions as $branch) {
            foreach ($branch['scriptures'] as $scripture) {
                $scriptureIds[$scripture['id']] = true;
            }
        }
        return count($scriptureIds);
    }

    /**
     * Count unique EGW references across all branches.
     */
    protected function countUniqueEgwReferences(Condition $condition, array $solutions): int
    {
        $egwIds = [];
        foreach ($solutions as $branch) {
            foreach ($branch['egwReferences'] as $egwRef) {
                $egwIds[$egwRef['id']] = true;
            }
        }
        return count($egwIds);
    }

    // ==================== Risk Factor CRUD ====================

    /**
     * List risk factors for a condition.
     */
    public function riskFactors(Condition $condition): AnonymousResourceCollection
    {
        $riskFactors = $condition->riskFactors()
            ->with(['creator', 'updater'])
            ->orderBy('order_index')
            ->get();

        return ConditionRiskFactorResource::collection($riskFactors);
    }

    /**
     * Store a new risk factor.
     */
    public function storeRiskFactor(Request $request, Condition $condition): ConditionRiskFactorResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'risk_type' => ['required', Rule::in(array_keys(ConditionRiskFactor::getRiskTypes()))],
            'severity' => ['required', Rule::in(array_keys(ConditionRiskFactor::getSeverityLevels()))],
            'order_index' => 'nullable|integer|min:0',
        ]);

        $validated['condition_id'] = $condition->id;

        $riskFactor = ConditionRiskFactor::create($validated);

        return new ConditionRiskFactorResource($riskFactor);
    }

    /**
     * Update a risk factor.
     */
    public function updateRiskFactor(Request $request, Condition $condition, ConditionRiskFactor $riskFactor): ConditionRiskFactorResource
    {
        // Ensure the risk factor belongs to this condition
        if ($riskFactor->condition_id !== $condition->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'risk_type' => ['sometimes', 'required', Rule::in(array_keys(ConditionRiskFactor::getRiskTypes()))],
            'severity' => ['sometimes', 'required', Rule::in(array_keys(ConditionRiskFactor::getSeverityLevels()))],
            'order_index' => 'nullable|integer|min:0',
        ]);

        $riskFactor->update($validated);

        return new ConditionRiskFactorResource($riskFactor);
    }

    /**
     * Delete a risk factor.
     */
    public function destroyRiskFactor(Condition $condition, ConditionRiskFactor $riskFactor): Response
    {
        if ($riskFactor->condition_id !== $condition->id) {
            abort(404);
        }

        $riskFactor->delete();

        return response()->noContent();
    }

    // ==================== Complication CRUD ====================

    /**
     * List complications for a condition.
     */
    public function complications(Condition $condition): AnonymousResourceCollection
    {
        $complications = $condition->complications()
            ->with(['complicationCondition', 'creator', 'updater'])
            ->orderBy('order_index')
            ->get();

        return ConditionComplicationResource::collection($complications);
    }

    /**
     * Store a new complication.
     */
    public function storeComplication(Request $request, Condition $condition): ConditionComplicationResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'complication_condition_id' => 'nullable|exists:conditions,id',
            'likelihood' => ['required', Rule::in(array_keys(ConditionComplication::getLikelihoodLevels()))],
            'timeframe' => 'nullable|string|max:100',
            'preventable' => 'boolean',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $validated['source_condition_id'] = $condition->id;

        $complication = ConditionComplication::create($validated);

        $complication->load('complicationCondition');

        return new ConditionComplicationResource($complication);
    }

    /**
     * Update a complication.
     */
    public function updateComplication(Request $request, Condition $condition, ConditionComplication $complication): ConditionComplicationResource
    {
        if ($complication->source_condition_id !== $condition->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'complication_condition_id' => 'nullable|exists:conditions,id',
            'likelihood' => ['sometimes', 'required', Rule::in(array_keys(ConditionComplication::getLikelihoodLevels()))],
            'timeframe' => 'nullable|string|max:100',
            'preventable' => 'boolean',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $complication->update($validated);
        $complication->load('complicationCondition');

        return new ConditionComplicationResource($complication);
    }

    /**
     * Delete a complication.
     */
    public function destroyComplication(Condition $condition, ConditionComplication $complication): Response
    {
        if ($complication->source_condition_id !== $condition->id) {
            abort(404);
        }

        $complication->delete();

        return response()->noContent();
    }
}
