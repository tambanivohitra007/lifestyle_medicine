<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\Intervention;
use App\Models\Scripture;
use App\Models\Recipe;
use App\Models\EgwReference;
use App\Models\EvidenceEntry;
use App\Models\User;
use App\Models\CareDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Get overview statistics for the dashboard
     */
    public function overview(): JsonResponse
    {
        $data = Cache::remember('analytics.overview', 300, function () {
            $today = Carbon::today();
            $weekStart = Carbon::now()->startOfWeek();
            $monthStart = Carbon::now()->startOfMonth();

            return [
                'counts' => [
                    'conditions' => Condition::count(),
                    'interventions' => Intervention::count(),
                    'scriptures' => Scripture::count(),
                    'recipes' => Recipe::count(),
                    'egw_references' => EgwReference::count(),
                    'evidence_entries' => EvidenceEntry::count(),
                    'users' => User::count(),
                    'care_domains' => CareDomain::count(),
                ],
                'today' => [
                    'created' => $this->getCreatedCount($today),
                    'updated' => $this->getUpdatedCount($today),
                ],
                'this_week' => [
                    'created' => $this->getCreatedCount($weekStart),
                    'updated' => $this->getUpdatedCount($weekStart),
                ],
                'this_month' => [
                    'created' => $this->getCreatedCount($monthStart),
                    'updated' => $this->getUpdatedCount($monthStart),
                ],
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get conditions grouped by category for pie chart
     */
    public function conditionsByCategory(): JsonResponse
    {
        $data = Cache::remember('analytics.conditions_by_category', 300, function () {
            return Condition::select('category', DB::raw('COUNT(*) as count'))
                ->whereNotNull('category')
                ->where('category', '!=', '')
                ->groupBy('category')
                ->orderByDesc('count')
                ->get()
                ->map(fn($item) => [
                    'category' => $item->category,
                    'count' => (int) $item->count,
                ]);
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get interventions grouped by care domain for bar chart
     */
    public function interventionsByDomain(): JsonResponse
    {
        $data = Cache::remember('analytics.interventions_by_domain', 300, function () {
            return Intervention::select('care_domains.name as domain', DB::raw('COUNT(interventions.id) as count'))
                ->join('care_domains', 'interventions.care_domain_id', '=', 'care_domains.id')
                ->groupBy('care_domains.id', 'care_domains.name')
                ->orderByDesc('count')
                ->get()
                ->map(fn($item) => [
                    'domain' => $item->domain,
                    'count' => (int) $item->count,
                ]);
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get content growth over time for line chart
     */
    public function growth(Request $request): JsonResponse
    {
        $months = $request->get('months', 12);
        $months = min(max($months, 3), 24); // Limit between 3 and 24 months

        $cacheKey = "analytics.growth.{$months}";

        $data = Cache::remember($cacheKey, 300, function () use ($months) {
            $startDate = Carbon::now()->subMonths($months)->startOfMonth();

            $models = [
                'conditions' => Condition::class,
                'interventions' => Intervention::class,
                'scriptures' => Scripture::class,
                'recipes' => Recipe::class,
                'egw_references' => EgwReference::class,
            ];

            $result = [];

            for ($i = $months; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $monthKey = $date->format('Y-m');
                $monthLabel = $date->format('M Y');

                $monthData = [
                    'month' => $monthKey,
                    'label' => $monthLabel,
                ];

                foreach ($models as $key => $model) {
                    $monthData[$key] = $model::whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->count();
                }

                $result[] = $monthData;
            }

            return $result;
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get recent user activity (creates and updates)
     */
    public function userActivity(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $limit = min(max($limit, 5), 50); // Limit between 5 and 50

        $activities = collect();

        // Get recent activities from each model
        $models = [
            ['model' => Condition::class, 'type' => 'condition', 'name_field' => 'name'],
            ['model' => Intervention::class, 'type' => 'intervention', 'name_field' => 'name'],
            ['model' => Scripture::class, 'type' => 'scripture', 'name_field' => 'reference'],
            ['model' => Recipe::class, 'type' => 'recipe', 'name_field' => 'title'],
            ['model' => EgwReference::class, 'type' => 'egw_reference', 'name_field' => 'citation'],
        ];

        foreach ($models as $config) {
            // Get recently created
            $created = $config['model']::with('creator')
                ->whereNotNull('created_by')
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'type' => $config['type'],
                    'name' => $item->{$config['name_field']},
                    'action' => 'created',
                    'user' => $item->creator?->name ?? 'Unknown',
                    'user_id' => $item->created_by,
                    'timestamp' => $item->created_at->toISOString(),
                ]);

            $activities = $activities->merge($created);

            // Get recently updated (where updated_at != created_at)
            $updated = $config['model']::with('updater')
                ->whereNotNull('updated_by')
                ->whereColumn('updated_at', '!=', 'created_at')
                ->orderByDesc('updated_at')
                ->limit($limit)
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'type' => $config['type'],
                    'name' => $item->{$config['name_field']},
                    'action' => 'updated',
                    'user' => $item->updater?->name ?? 'Unknown',
                    'user_id' => $item->updated_by,
                    'timestamp' => $item->updated_at->toISOString(),
                ]);

            $activities = $activities->merge($updated);
        }

        // Sort by timestamp and take the most recent
        $activities = $activities
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values();

        return response()->json(['data' => $activities]);
    }

    /**
     * Get evidence quality distribution
     */
    public function evidenceQuality(): JsonResponse
    {
        $data = Cache::remember('analytics.evidence_quality', 300, function () {
            $qualityLevels = [
                'high' => ['A', 'I'],
                'moderate' => ['B', 'II'],
                'low' => ['C', 'III'],
                'very_low' => ['D', 'IV'],
            ];

            $distribution = [];

            foreach ($qualityLevels as $level => $grades) {
                $count = EvidenceEntry::whereIn('quality_rating', $grades)->count();
                $distribution[] = [
                    'level' => $level,
                    'label' => ucfirst(str_replace('_', ' ', $level)),
                    'count' => $count,
                ];
            }

            // Add unrated
            $unrated = EvidenceEntry::whereNull('quality_rating')
                ->orWhere('quality_rating', '')
                ->count();

            if ($unrated > 0) {
                $distribution[] = [
                    'level' => 'unrated',
                    'label' => 'Unrated',
                    'count' => $unrated,
                ];
            }

            return $distribution;
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get content completeness scores
     */
    public function contentCompleteness(): JsonResponse
    {
        $data = Cache::remember('analytics.content_completeness', 600, function () {
            $result = [];

            // Conditions completeness
            $conditions = Condition::all();
            $conditionScores = $conditions->map(function ($condition) {
                $score = 0;
                $maxScore = 5;

                if (!empty($condition->name)) $score++;
                if (!empty($condition->summary)) $score++;
                if (!empty($condition->category)) $score++;
                if ($condition->sections()->count() > 0) $score++;
                if ($condition->interventions()->count() > 0) $score++;

                return ($score / $maxScore) * 100;
            });

            $result['conditions'] = [
                'total' => $conditions->count(),
                'complete' => $conditionScores->filter(fn($s) => $s >= 80)->count(),
                'partial' => $conditionScores->filter(fn($s) => $s >= 40 && $s < 80)->count(),
                'incomplete' => $conditionScores->filter(fn($s) => $s < 40)->count(),
                'average_score' => round($conditionScores->avg() ?? 0, 1),
            ];

            // Interventions completeness
            $interventions = Intervention::all();
            $interventionScores = $interventions->map(function ($intervention) {
                $score = 0;
                $maxScore = 5;

                if (!empty($intervention->name)) $score++;
                if (!empty($intervention->description)) $score++;
                if (!empty($intervention->care_domain_id)) $score++;
                if ($intervention->evidenceEntries()->count() > 0) $score++;
                if ($intervention->conditions()->count() > 0) $score++;

                return ($score / $maxScore) * 100;
            });

            $result['interventions'] = [
                'total' => $interventions->count(),
                'complete' => $interventionScores->filter(fn($s) => $s >= 80)->count(),
                'partial' => $interventionScores->filter(fn($s) => $s >= 40 && $s < 80)->count(),
                'incomplete' => $interventionScores->filter(fn($s) => $s < 40)->count(),
                'average_score' => round($interventionScores->avg() ?? 0, 1),
            ];

            // Recipes completeness
            $recipes = Recipe::all();
            $recipeScores = $recipes->map(function ($recipe) {
                $score = 0;
                $maxScore = 5;

                if (!empty($recipe->title)) $score++;
                if (!empty($recipe->description)) $score++;
                if (!empty($recipe->ingredients)) $score++;
                if (!empty($recipe->instructions)) $score++;
                if ($recipe->conditions()->count() > 0) $score++;

                return ($score / $maxScore) * 100;
            });

            $result['recipes'] = [
                'total' => $recipes->count(),
                'complete' => $recipeScores->filter(fn($s) => $s >= 80)->count(),
                'partial' => $recipeScores->filter(fn($s) => $s >= 40 && $s < 80)->count(),
                'incomplete' => $recipeScores->filter(fn($s) => $s < 40)->count(),
                'average_score' => round($recipeScores->avg() ?? 0, 1),
            ];

            return $result;
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Export analytics report as JSON
     */
    public function exportReport(): JsonResponse
    {
        $report = [
            'generated_at' => Carbon::now()->toISOString(),
            'overview' => $this->getOverviewData(),
            'conditions_by_category' => $this->getConditionsByCategoryData(),
            'interventions_by_domain' => $this->getInterventionsByDomainData(),
            'evidence_quality' => $this->getEvidenceQualityData(),
            'content_completeness' => $this->getContentCompletenessData(),
        ];

        return response()->json([
            'data' => $report,
            'filename' => 'analytics_report_' . Carbon::now()->format('Y-m-d_His') . '.json',
        ]);
    }

    /**
     * Get created count since a given date
     */
    private function getCreatedCount(Carbon $since): int
    {
        return Condition::where('created_at', '>=', $since)->count()
            + Intervention::where('created_at', '>=', $since)->count()
            + Scripture::where('created_at', '>=', $since)->count()
            + Recipe::where('created_at', '>=', $since)->count()
            + EgwReference::where('created_at', '>=', $since)->count();
    }

    /**
     * Get updated count since a given date
     */
    private function getUpdatedCount(Carbon $since): int
    {
        return Condition::where('updated_at', '>=', $since)->whereColumn('updated_at', '!=', 'created_at')->count()
            + Intervention::where('updated_at', '>=', $since)->whereColumn('updated_at', '!=', 'created_at')->count()
            + Scripture::where('updated_at', '>=', $since)->whereColumn('updated_at', '!=', 'created_at')->count()
            + Recipe::where('updated_at', '>=', $since)->whereColumn('updated_at', '!=', 'created_at')->count()
            + EgwReference::where('updated_at', '>=', $since)->whereColumn('updated_at', '!=', 'created_at')->count();
    }

    // Helper methods to get data without caching for export
    private function getOverviewData(): array
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        return [
            'counts' => [
                'conditions' => Condition::count(),
                'interventions' => Intervention::count(),
                'scriptures' => Scripture::count(),
                'recipes' => Recipe::count(),
                'egw_references' => EgwReference::count(),
                'evidence_entries' => EvidenceEntry::count(),
                'users' => User::count(),
            ],
            'today' => ['created' => $this->getCreatedCount($today)],
            'this_week' => ['created' => $this->getCreatedCount($weekStart)],
            'this_month' => ['created' => $this->getCreatedCount($monthStart)],
        ];
    }

    private function getConditionsByCategoryData(): array
    {
        return Condition::select('category', DB::raw('COUNT(*) as count'))
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->groupBy('category')
            ->orderByDesc('count')
            ->get()
            ->toArray();
    }

    private function getInterventionsByDomainData(): array
    {
        return Intervention::select('care_domains.name as domain', DB::raw('COUNT(interventions.id) as count'))
            ->join('care_domains', 'interventions.care_domain_id', '=', 'care_domains.id')
            ->groupBy('care_domains.id', 'care_domains.name')
            ->orderByDesc('count')
            ->get()
            ->toArray();
    }

    private function getEvidenceQualityData(): array
    {
        $qualityLevels = [
            'high' => ['A', 'I'],
            'moderate' => ['B', 'II'],
            'low' => ['C', 'III'],
            'very_low' => ['D', 'IV'],
        ];

        $distribution = [];
        foreach ($qualityLevels as $level => $grades) {
            $distribution[$level] = EvidenceEntry::whereIn('quality_rating', $grades)->count();
        }

        return $distribution;
    }

    private function getContentCompletenessData(): array
    {
        return [
            'conditions' => [
                'total' => Condition::count(),
                'with_summary' => Condition::whereNotNull('summary')->where('summary', '!=', '')->count(),
                'with_category' => Condition::whereNotNull('category')->where('category', '!=', '')->count(),
            ],
            'interventions' => [
                'total' => Intervention::count(),
                'with_description' => Intervention::whereNotNull('description')->where('description', '!=', '')->count(),
                'with_care_domain' => Intervention::whereNotNull('care_domain_id')->count(),
            ],
        ];
    }
}
