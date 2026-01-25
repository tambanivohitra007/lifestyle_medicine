<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\Intervention;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeGraphController extends Controller
{
    /**
     * Node type configurations with colors and icons.
     */
    protected const NODE_COLORS = [
        'condition' => '#ef4444',      // Red
        'intervention' => '#f43f5e',   // Rose
        'careDomain' => '#3b82f6',     // Blue
        'scripture' => '#6366f1',      // Indigo
        'egwReference' => '#8b5cf6',   // Purple
        'recipe' => '#f59e0b',         // Amber
        'evidenceEntry' => '#10b981',  // Emerald
        'reference' => '#64748b',      // Slate
    ];

    /**
     * Edge colors based on strength of evidence.
     */
    protected const EVIDENCE_COLORS = [
        'high' => '#22c55e',        // Green
        'moderate' => '#eab308',    // Yellow
        'emerging' => '#3b82f6',    // Blue
        'insufficient' => '#9ca3af', // Gray
    ];

    /**
     * Get knowledge graph centered on a condition.
     */
    public function conditionGraph(Condition $condition, Request $request): JsonResponse
    {
        $depth = min((int) $request->get('depth', 2), 3);

        $nodes = [];
        $edges = [];
        $nodeIds = []; // Track added nodes to avoid duplicates

        // Add center node (condition)
        $conditionNodeId = "condition-{$condition->id}";
        $nodes[] = $this->createConditionNode($condition, true);
        $nodeIds[$conditionNodeId] = true;

        // Load relationships
        $condition->load([
            'interventions.careDomain',
            'interventions.evidenceEntries.references',
            'scriptures',
            'recipes',
            'egwReferences',
        ]);

        // Level 1: Direct relationships

        // Interventions
        foreach ($condition->interventions as $intervention) {
            $interventionNodeId = "intervention-{$intervention->id}";

            if (!isset($nodeIds[$interventionNodeId])) {
                $nodes[] = $this->createInterventionNode($intervention);
                $nodeIds[$interventionNodeId] = true;
            }

            $edges[] = $this->createConditionInterventionEdge($condition, $intervention);

            if ($depth >= 2) {
                // Care Domain
                if ($intervention->careDomain) {
                    $domainNodeId = "careDomain-{$intervention->careDomain->id}";
                    if (!isset($nodeIds[$domainNodeId])) {
                        $nodes[] = $this->createCareDomainNode($intervention->careDomain);
                        $nodeIds[$domainNodeId] = true;
                    }
                    $edges[] = [
                        'id' => "edge-domain-int-{$intervention->careDomain->id}-{$intervention->id}",
                        'source' => $domainNodeId,
                        'target' => $interventionNodeId,
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['careDomain'], 'strokeWidth' => 2],
                    ];
                }

                // Evidence Entries
                foreach ($intervention->evidenceEntries as $evidence) {
                    $evidenceNodeId = "evidence-{$evidence->id}";
                    if (!isset($nodeIds[$evidenceNodeId])) {
                        $nodes[] = $this->createEvidenceNode($evidence);
                        $nodeIds[$evidenceNodeId] = true;
                    }
                    $edges[] = [
                        'id' => "edge-int-ev-{$intervention->id}-{$evidence->id}",
                        'source' => $interventionNodeId,
                        'target' => $evidenceNodeId,
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['evidenceEntry'], 'strokeWidth' => 1],
                    ];

                    if ($depth >= 3) {
                        // References
                        foreach ($evidence->references as $reference) {
                            $refNodeId = "reference-{$reference->id}";
                            if (!isset($nodeIds[$refNodeId])) {
                                $nodes[] = $this->createReferenceNode($reference);
                                $nodeIds[$refNodeId] = true;
                            }
                            $edges[] = [
                                'id' => "edge-ev-ref-{$evidence->id}-{$reference->id}",
                                'source' => $evidenceNodeId,
                                'target' => $refNodeId,
                                'type' => 'default',
                                'style' => ['stroke' => self::NODE_COLORS['reference'], 'strokeWidth' => 1, 'strokeDasharray' => '3,3'],
                            ];
                        }
                    }
                }
            }
        }

        // Scriptures
        foreach ($condition->scriptures as $scripture) {
            $scriptureNodeId = "scripture-{$scripture->id}";
            if (!isset($nodeIds[$scriptureNodeId])) {
                $nodes[] = $this->createScriptureNode($scripture);
                $nodeIds[$scriptureNodeId] = true;
            }
            $edges[] = [
                'id' => "edge-cond-scr-{$condition->id}-{$scripture->id}",
                'source' => $conditionNodeId,
                'target' => $scriptureNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['scripture'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
            ];
        }

        // Recipes
        foreach ($condition->recipes as $recipe) {
            $recipeNodeId = "recipe-{$recipe->id}";
            if (!isset($nodeIds[$recipeNodeId])) {
                $nodes[] = $this->createRecipeNode($recipe);
                $nodeIds[$recipeNodeId] = true;
            }
            $edges[] = [
                'id' => "edge-cond-rec-{$condition->id}-{$recipe->id}",
                'source' => $conditionNodeId,
                'target' => $recipeNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['recipe'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
            ];
        }

        // EGW References
        foreach ($condition->egwReferences as $egwRef) {
            $egwNodeId = "egwReference-{$egwRef->id}";
            if (!isset($nodeIds[$egwNodeId])) {
                $nodes[] = $this->createEgwReferenceNode($egwRef);
                $nodeIds[$egwNodeId] = true;
            }
            $edges[] = [
                'id' => "edge-cond-egw-{$condition->id}-{$egwRef->id}",
                'source' => $conditionNodeId,
                'target' => $egwNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['egwReference'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
            ];
        }

        return response()->json([
            'nodes' => $nodes,
            'edges' => $edges,
            'meta' => [
                'centerNode' => $conditionNodeId,
                'centerType' => 'condition',
                'depth' => $depth,
                'totalNodes' => count($nodes),
                'totalEdges' => count($edges),
            ],
        ]);
    }

    /**
     * Get knowledge graph centered on an intervention.
     */
    public function interventionGraph(Intervention $intervention, Request $request): JsonResponse
    {
        $depth = min((int) $request->get('depth', 2), 3);

        $nodes = [];
        $edges = [];
        $nodeIds = [];

        // Add center node (intervention)
        $interventionNodeId = "intervention-{$intervention->id}";
        $nodes[] = $this->createInterventionNode($intervention, true);
        $nodeIds[$interventionNodeId] = true;

        // Load relationships
        $intervention->load([
            'careDomain',
            'conditions',
            'evidenceEntries.references',
            'scriptures',
            'recipes',
            'egwReferences',
        ]);

        // Care Domain
        if ($intervention->careDomain) {
            $domainNodeId = "careDomain-{$intervention->careDomain->id}";
            $nodes[] = $this->createCareDomainNode($intervention->careDomain);
            $nodeIds[$domainNodeId] = true;
            $edges[] = [
                'id' => "edge-domain-int-{$intervention->careDomain->id}-{$intervention->id}",
                'source' => $domainNodeId,
                'target' => $interventionNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['careDomain'], 'strokeWidth' => 2],
            ];
        }

        // Conditions
        foreach ($intervention->conditions as $condition) {
            $conditionNodeId = "condition-{$condition->id}";
            if (!isset($nodeIds[$conditionNodeId])) {
                $nodes[] = $this->createConditionNode($condition);
                $nodeIds[$conditionNodeId] = true;
            }
            $edges[] = $this->createConditionInterventionEdge($condition, $intervention);
        }

        // Evidence Entries
        foreach ($intervention->evidenceEntries as $evidence) {
            $evidenceNodeId = "evidence-{$evidence->id}";
            $nodes[] = $this->createEvidenceNode($evidence);
            $nodeIds[$evidenceNodeId] = true;
            $edges[] = [
                'id' => "edge-int-ev-{$intervention->id}-{$evidence->id}",
                'source' => $interventionNodeId,
                'target' => $evidenceNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['evidenceEntry'], 'strokeWidth' => 1],
            ];

            if ($depth >= 2) {
                foreach ($evidence->references as $reference) {
                    $refNodeId = "reference-{$reference->id}";
                    if (!isset($nodeIds[$refNodeId])) {
                        $nodes[] = $this->createReferenceNode($reference);
                        $nodeIds[$refNodeId] = true;
                    }
                    $edges[] = [
                        'id' => "edge-ev-ref-{$evidence->id}-{$reference->id}",
                        'source' => $evidenceNodeId,
                        'target' => $refNodeId,
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['reference'], 'strokeWidth' => 1, 'strokeDasharray' => '3,3'],
                    ];
                }
            }
        }

        // Scriptures
        foreach ($intervention->scriptures as $scripture) {
            $scriptureNodeId = "scripture-{$scripture->id}";
            if (!isset($nodeIds[$scriptureNodeId])) {
                $nodes[] = $this->createScriptureNode($scripture);
                $nodeIds[$scriptureNodeId] = true;
            }
            $edges[] = [
                'id' => "edge-int-scr-{$intervention->id}-{$scripture->id}",
                'source' => $interventionNodeId,
                'target' => $scriptureNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['scripture'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
            ];
        }

        // Recipes
        foreach ($intervention->recipes as $recipe) {
            $recipeNodeId = "recipe-{$recipe->id}";
            if (!isset($nodeIds[$recipeNodeId])) {
                $nodes[] = $this->createRecipeNode($recipe);
                $nodeIds[$recipeNodeId] = true;
            }
            $edges[] = [
                'id' => "edge-int-rec-{$intervention->id}-{$recipe->id}",
                'source' => $interventionNodeId,
                'target' => $recipeNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['recipe'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
            ];
        }

        // EGW References
        foreach ($intervention->egwReferences as $egwRef) {
            $egwNodeId = "egwReference-{$egwRef->id}";
            if (!isset($nodeIds[$egwNodeId])) {
                $nodes[] = $this->createEgwReferenceNode($egwRef);
                $nodeIds[$egwNodeId] = true;
            }
            $edges[] = [
                'id' => "edge-int-egw-{$intervention->id}-{$egwRef->id}",
                'source' => $interventionNodeId,
                'target' => $egwNodeId,
                'type' => 'default',
                'style' => ['stroke' => self::NODE_COLORS['egwReference'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
            ];
        }

        return response()->json([
            'nodes' => $nodes,
            'edges' => $edges,
            'meta' => [
                'centerNode' => $interventionNodeId,
                'centerType' => 'intervention',
                'depth' => $depth,
                'totalNodes' => count($nodes),
                'totalEdges' => count($edges),
            ],
        ]);
    }

    /**
     * Get full knowledge graph with pagination.
     * Supports filtering by node type and cursor-based pagination for lazy loading.
     */
    public function fullGraph(Request $request): JsonResponse
    {
        $limit = min((int) $request->get('limit', 50), 100);
        $page = max((int) $request->get('page', 1), 1);
        $nodeTypes = $request->get('types') ? explode(',', $request->get('types')) : null;
        $includeEdges = $request->boolean('edges', true);

        $nodes = [];
        $edges = [];
        $nodeIds = [];
        $stats = [
            'conditions' => 0,
            'interventions' => 0,
            'careDomains' => 0,
            'scriptures' => 0,
            'recipes' => 0,
            'egwReferences' => 0,
            'evidenceEntries' => 0,
            'references' => 0,
        ];

        // Helper to check if type is requested
        $shouldInclude = fn($type) => $nodeTypes === null || in_array($type, $nodeTypes);

        // Calculate offset for pagination
        $offset = ($page - 1) * $limit;
        $remaining = $limit;
        $currentOffset = 0;

        // Fetch conditions
        if ($shouldInclude('condition') && $remaining > 0) {
            $conditions = Condition::query()
                ->orderBy('name')
                ->get();

            $stats['conditions'] = $conditions->count();

            foreach ($conditions as $condition) {
                if ($currentOffset >= $offset && $remaining > 0) {
                    $nodes[] = $this->createConditionNode($condition);
                    $nodeIds["condition-{$condition->id}"] = true;
                    $remaining--;
                }
                $currentOffset++;
            }
        }

        // Fetch interventions
        if ($shouldInclude('intervention') && $remaining > 0) {
            $interventions = Intervention::with('careDomain')
                ->orderBy('name')
                ->get();

            $stats['interventions'] = $interventions->count();

            foreach ($interventions as $intervention) {
                if ($currentOffset >= $offset && $remaining > 0) {
                    $nodes[] = $this->createInterventionNode($intervention);
                    $nodeIds["intervention-{$intervention->id}"] = true;
                    $remaining--;
                }
                $currentOffset++;
            }
        }

        // Fetch care domains
        if ($shouldInclude('careDomain') && $remaining > 0) {
            $careDomains = \App\Models\CareDomain::orderBy('name')->get();
            $stats['careDomains'] = $careDomains->count();

            foreach ($careDomains as $domain) {
                if ($currentOffset >= $offset && $remaining > 0) {
                    $nodes[] = $this->createCareDomainNode($domain);
                    $nodeIds["careDomain-{$domain->id}"] = true;
                    $remaining--;
                }
                $currentOffset++;
            }
        }

        // Fetch scriptures
        if ($shouldInclude('scripture') && $remaining > 0) {
            $scriptures = \App\Models\Scripture::orderBy('reference')->get();
            $stats['scriptures'] = $scriptures->count();

            foreach ($scriptures as $scripture) {
                if ($currentOffset >= $offset && $remaining > 0) {
                    $nodes[] = $this->createScriptureNode($scripture);
                    $nodeIds["scripture-{$scripture->id}"] = true;
                    $remaining--;
                }
                $currentOffset++;
            }
        }

        // Fetch recipes
        if ($shouldInclude('recipe') && $remaining > 0) {
            $recipes = \App\Models\Recipe::orderBy('title')->get();
            $stats['recipes'] = $recipes->count();

            foreach ($recipes as $recipe) {
                if ($currentOffset >= $offset && $remaining > 0) {
                    $nodes[] = $this->createRecipeNode($recipe);
                    $nodeIds["recipe-{$recipe->id}"] = true;
                    $remaining--;
                }
                $currentOffset++;
            }
        }

        // Fetch EGW references
        if ($shouldInclude('egwReference') && $remaining > 0) {
            $egwRefs = \App\Models\EgwReference::orderBy('citation')->get();
            $stats['egwReferences'] = $egwRefs->count();

            foreach ($egwRefs as $egwRef) {
                if ($currentOffset >= $offset && $remaining > 0) {
                    $nodes[] = $this->createEgwReferenceNode($egwRef);
                    $nodeIds["egwReference-{$egwRef->id}"] = true;
                    $remaining--;
                }
                $currentOffset++;
            }
        }

        // Fetch edges only for visible nodes (if requested)
        if ($includeEdges && count($nodeIds) > 0) {
            // Condition-Intervention edges
            $conditionInterventions = \DB::table('condition_intervention')
                ->get();

            foreach ($conditionInterventions as $pivot) {
                $sourceId = "condition-{$pivot->condition_id}";
                $targetId = "intervention-{$pivot->intervention_id}";

                if (isset($nodeIds[$sourceId]) && isset($nodeIds[$targetId])) {
                    $edges[] = [
                        'id' => "edge-cond-int-{$pivot->condition_id}-{$pivot->intervention_id}",
                        'source' => $sourceId,
                        'target' => $targetId,
                        'type' => 'condition-intervention',
                        'animated' => $pivot->strength_of_evidence === 'high',
                        'data' => [
                            'strengthOfEvidence' => $pivot->strength_of_evidence ?? 'emerging',
                            'recommendationLevel' => $pivot->recommendation_level ?? 'optional',
                            'clinicalNotes' => $pivot->clinical_notes,
                        ],
                    ];
                }
            }

            // Intervention-CareDomain edges
            $interventions = Intervention::whereNotNull('care_domain_id')->get();
            foreach ($interventions as $intervention) {
                $sourceId = "careDomain-{$intervention->care_domain_id}";
                $targetId = "intervention-{$intervention->id}";

                if (isset($nodeIds[$sourceId]) && isset($nodeIds[$targetId])) {
                    $edges[] = [
                        'id' => "edge-domain-int-{$intervention->care_domain_id}-{$intervention->id}",
                        'source' => $sourceId,
                        'target' => $targetId,
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['careDomain'], 'strokeWidth' => 2],
                    ];
                }
            }

            // Scripture relationships
            $conditionScriptures = \DB::table('condition_scripture')->get();
            foreach ($conditionScriptures as $pivot) {
                $sourceId = "condition-{$pivot->condition_id}";
                $targetId = "scripture-{$pivot->scripture_id}";

                if (isset($nodeIds[$sourceId]) && isset($nodeIds[$targetId])) {
                    $edges[] = [
                        'id' => "edge-cond-scr-{$pivot->condition_id}-{$pivot->scripture_id}",
                        'source' => $sourceId,
                        'target' => $targetId,
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['scripture'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
                    ];
                }
            }

            // Recipe relationships
            $conditionRecipes = \DB::table('condition_recipe')->get();
            foreach ($conditionRecipes as $pivot) {
                $sourceId = "condition-{$pivot->condition_id}";
                $targetId = "recipe-{$pivot->recipe_id}";

                if (isset($nodeIds[$sourceId]) && isset($nodeIds[$targetId])) {
                    $edges[] = [
                        'id' => "edge-cond-rec-{$pivot->condition_id}-{$pivot->recipe_id}",
                        'source' => $sourceId,
                        'target' => $targetId,
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['recipe'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
                    ];
                }
            }

            // EGW Reference relationships
            $conditionEgw = \DB::table('condition_egw_reference')->get();
            foreach ($conditionEgw as $pivot) {
                $sourceId = "condition-{$pivot->condition_id}";
                $targetId = "egwReference-{$pivot->egw_reference_id}";

                if (isset($nodeIds[$sourceId]) && isset($nodeIds[$targetId])) {
                    $edges[] = [
                        'id' => "edge-cond-egw-{$pivot->condition_id}-{$pivot->egw_reference_id}",
                        'source' => $sourceId,
                        'target' => $targetId,
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['egwReference'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
                    ];
                }
            }
        }

        // Calculate totals
        $totalNodes = array_sum($stats);
        $totalPages = ceil($totalNodes / $limit);

        return response()->json([
            'nodes' => $nodes,
            'edges' => $edges,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'totalNodes' => $totalNodes,
                'totalEdges' => count($edges),
                'totalPages' => $totalPages,
                'hasMore' => $page < $totalPages,
                'stats' => $stats,
            ],
        ]);
    }

    // ==================== Node Creators ====================

    protected function createConditionNode($condition, bool $isCenter = false): array
    {
        return [
            'id' => "condition-{$condition->id}",
            'type' => 'condition',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => $condition->name,
                'entityId' => $condition->id,
                'category' => $condition->category,
                'summary' => $condition->summary,
                'isCenter' => $isCenter,
                'color' => self::NODE_COLORS['condition'],
            ],
        ];
    }

    protected function createInterventionNode($intervention, bool $isCenter = false): array
    {
        return [
            'id' => "intervention-{$intervention->id}",
            'type' => 'intervention',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => $intervention->name,
                'entityId' => $intervention->id,
                'careDomain' => $intervention->careDomain?->name,
                'mechanism' => $intervention->mechanism,
                'isCenter' => $isCenter,
                'color' => self::NODE_COLORS['intervention'],
            ],
        ];
    }

    protected function createCareDomainNode($careDomain): array
    {
        return [
            'id' => "careDomain-{$careDomain->id}",
            'type' => 'careDomain',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => $careDomain->name,
                'entityId' => $careDomain->id,
                'description' => $careDomain->description,
                'icon' => $careDomain->icon,
                'color' => self::NODE_COLORS['careDomain'],
            ],
        ];
    }

    protected function createScriptureNode($scripture): array
    {
        return [
            'id' => "scripture-{$scripture->id}",
            'type' => 'scripture',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => $scripture->reference,
                'entityId' => $scripture->id,
                'text' => $scripture->text,
                'theme' => $scripture->theme,
                'color' => self::NODE_COLORS['scripture'],
            ],
        ];
    }

    protected function createRecipeNode($recipe): array
    {
        return [
            'id' => "recipe-{$recipe->id}",
            'type' => 'recipe',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => $recipe->title,
                'entityId' => $recipe->id,
                'description' => $recipe->description,
                'dietaryTags' => $recipe->dietary_tags,
                'color' => self::NODE_COLORS['recipe'],
            ],
        ];
    }

    protected function createEgwReferenceNode($egwRef): array
    {
        return [
            'id' => "egwReference-{$egwRef->id}",
            'type' => 'egwReference',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => $egwRef->citation,
                'entityId' => $egwRef->id,
                'quote' => $egwRef->quote,
                'topic' => $egwRef->topic,
                'book' => $egwRef->book,
                'color' => self::NODE_COLORS['egwReference'],
            ],
        ];
    }

    protected function createEvidenceNode($evidence): array
    {
        return [
            'id' => "evidence-{$evidence->id}",
            'type' => 'evidenceEntry',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => ucfirst(str_replace('_', ' ', $evidence->study_type)),
                'entityId' => $evidence->id,
                'studyType' => $evidence->study_type,
                'qualityRating' => $evidence->quality_rating,
                'summary' => $evidence->summary,
                'population' => $evidence->population,
                'color' => self::NODE_COLORS['evidenceEntry'],
            ],
        ];
    }

    protected function createReferenceNode($reference): array
    {
        return [
            'id' => "reference-{$reference->id}",
            'type' => 'reference',
            'position' => ['x' => 0, 'y' => 0],
            'data' => [
                'label' => $reference->year ? "({$reference->year})" : 'Reference',
                'entityId' => $reference->id,
                'citation' => $reference->citation,
                'doi' => $reference->doi,
                'pmid' => $reference->pmid,
                'url' => $reference->url,
                'year' => $reference->year,
                'color' => self::NODE_COLORS['reference'],
            ],
        ];
    }

    // ==================== Edge Creators ====================

    protected function createConditionInterventionEdge($condition, $intervention): array
    {
        $pivot = $intervention->pivot;
        $strength = $pivot?->strength_of_evidence ?? 'emerging';
        $recommendation = $pivot?->recommendation_level ?? 'optional';

        return [
            'id' => "edge-cond-int-{$condition->id}-{$intervention->id}",
            'source' => "condition-{$condition->id}",
            'target' => "intervention-{$intervention->id}",
            'type' => 'condition-intervention', // Custom edge type with metadata display
            'animated' => $strength === 'high',
            'data' => [
                'strengthOfEvidence' => $strength,
                'recommendationLevel' => $recommendation,
                'clinicalNotes' => $pivot?->clinical_notes,
            ],
        ];
    }
}
