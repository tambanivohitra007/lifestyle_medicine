<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\Intervention;
use App\Models\InterventionRelationship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Builds interactive knowledge graph data for React Flow visualization.
 *
 * Generates nodes and edges representing relationships between conditions,
 * interventions, care domains, scriptures, recipes, EGW references,
 * evidence entries, and references. Supports condition-centered,
 * intervention-centered, and full-graph views with configurable depth.
 *
 * Routes: /api/v1/knowledge-graph/* (public read-only)
 */
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
        'bodySystem' => '#0ea5e9',     // Sky blue
    ];

    /**
     * Intervention relationship type colors.
     */
    protected const RELATIONSHIP_COLORS = [
        'synergy' => '#10b981',        // Emerald - positive
        'complementary' => '#22c55e',  // Green - positive
        'neutral' => '#94a3b8',        // Slate - neutral
        'caution' => '#f59e0b',        // Amber - warning
        'conflict' => '#ef4444',       // Red - negative
    ];

    /**
     * Effectiveness rating colors.
     */
    protected const EFFECTIVENESS_COLORS = [
        'very_high' => '#059669',      // Emerald-600
        'high' => '#16a34a',           // Green-600
        'moderate' => '#ca8a04',       // Yellow-600
        'low' => '#ea580c',            // Orange-600
        'uncertain' => '#64748b',      // Slate-500
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
            'bodySystem',
            'effectivenessRatings.intervention',
        ]);

        // Level 1: Direct relationships

        // Build effectiveness lookup for quick access
        $effectivenessLookup = [];
        foreach ($condition->effectivenessRatings as $rating) {
            $effectivenessLookup[$rating->intervention_id] = $rating;
        }

        // Interventions
        foreach ($condition->interventions as $intervention) {
            $interventionNodeId = "intervention-{$intervention->id}";

            if (! isset($nodeIds[$interventionNodeId])) {
                $nodes[] = $this->createInterventionNode($intervention);
                $nodeIds[$interventionNodeId] = true;
            }

            // Include effectiveness data if available
            $effectiveness = $effectivenessLookup[$intervention->id] ?? null;
            $edges[] = $this->createConditionInterventionEdge($condition, $intervention, $effectiveness);

            if ($depth >= 2) {
                // Care Domain
                if ($intervention->careDomain) {
                    $domainNodeId = "careDomain-{$intervention->careDomain->id}";
                    if (! isset($nodeIds[$domainNodeId])) {
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
                    if (! isset($nodeIds[$evidenceNodeId])) {
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
                            if (! isset($nodeIds[$refNodeId])) {
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
            if (! isset($nodeIds[$scriptureNodeId])) {
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
            if (! isset($nodeIds[$recipeNodeId])) {
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
            if (! isset($nodeIds[$egwNodeId])) {
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
            'conditions.effectivenessRatings',
            'evidenceEntries.references',
            'scriptures',
            'recipes',
            'egwReferences',
        ]);

        // Load intervention relationships (synergies and conflicts)
        $relationships = InterventionRelationship::involving($intervention->id)
            ->with(['interventionA', 'interventionB'])
            ->get();

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
            if (! isset($nodeIds[$conditionNodeId])) {
                // Load body system for condition node
                $condition->load('bodySystem');
                $nodes[] = $this->createConditionNode($condition);
                $nodeIds[$conditionNodeId] = true;
            }
            // Find effectiveness rating for this condition-intervention pair
            $effectiveness = $condition->effectivenessRatings
                ->where('intervention_id', $intervention->id)
                ->first();
            $edges[] = $this->createConditionInterventionEdge($condition, $intervention, $effectiveness);
        }

        // Intervention Relationships (synergies, conflicts, etc.)
        foreach ($relationships as $relationship) {
            // Get the other intervention in the relationship
            $otherIntervention = $relationship->intervention_a_id === $intervention->id
                ? $relationship->interventionB
                : $relationship->interventionA;

            if (! $otherIntervention) {
                continue;
            }

            $otherNodeId = "intervention-{$otherIntervention->id}";
            if (! isset($nodeIds[$otherNodeId])) {
                $nodes[] = $this->createInterventionNode($otherIntervention);
                $nodeIds[$otherNodeId] = true;
            }
            $edges[] = $this->createInterventionRelationshipEdge($relationship);
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
                    if (! isset($nodeIds[$refNodeId])) {
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
            if (! isset($nodeIds[$scriptureNodeId])) {
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
            if (! isset($nodeIds[$recipeNodeId])) {
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
            if (! isset($nodeIds[$egwNodeId])) {
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
    /**
     * Valid node types for the knowledge graph.
     */
    protected const VALID_NODE_TYPES = ['condition', 'intervention', 'careDomain', 'scripture', 'recipe', 'egwReference'];

    /**
     * Get the full knowledge graph with cross-type pagination.
     *
     * Supports filtering by node types and pagination across all entity types.
     * Edges are only fetched for currently visible nodes to optimize performance.
     *
     * GET /api/v1/knowledge-graph/full
     *
     * @param  Request  $request  Query params: limit (max 100), page, edges (bool), types (comma-separated)
     * @return JsonResponse Nodes, edges, and pagination metadata
     */
    public function treeGraph(): JsonResponse
    {
        $conditions = Condition::with([
            'interventions.careDomain',
            'scriptures',
            'recipes',
            'egwReferences',
        ])->orderBy('name')->get();

        $careDomains = \App\Models\CareDomain::withCount('interventions')
            ->orderBy('name')
            ->get();

        // Track which entities are linked to conditions
        $linkedInterventionIds = collect();
        $linkedScriptureIds = collect();
        $linkedRecipeIds = collect();
        $linkedEgwIds = collect();

        // Build condition branches
        $conditionChildren = [];
        foreach ($conditions as $condition) {
            $condNode = [
                'content' => '<span style="color:'.self::NODE_COLORS['condition'].';font-weight:600">'.e($condition->name).'</span>',
                'children' => [],
                'payload' => ['type' => 'condition', 'entityId' => $condition->id],
            ];

            // Interventions
            if ($condition->interventions->isNotEmpty()) {
                $intChildren = [];
                foreach ($condition->interventions as $intervention) {
                    $linkedInterventionIds->push($intervention->id);
                    $domain = $intervention->careDomain?->name;
                    $domainTag = $domain ? ' <em style="color:#6b7280;font-size:0.85em">('.$domain.')</em>' : '';
                    $strength = $intervention->pivot?->strength_of_evidence;
                    $badge = $strength ? ' <span style="background:'.($this->evidenceBadgeColor($strength)).';color:#fff;padding:1px 6px;border-radius:8px;font-size:0.75em">'.$strength.'</span>' : '';
                    $intChildren[] = [
                        'content' => '<span style="color:'.self::NODE_COLORS['intervention'].'">'.e($intervention->name).'</span>'.$domainTag.$badge,
                        'payload' => ['type' => 'intervention', 'entityId' => $intervention->id],
                    ];
                }
                $condNode['children'][] = [
                    'content' => '<strong>Interventions</strong> <span style="color:#6b7280;font-size:0.85em">('.$condition->interventions->count().')</span>',
                    'children' => $intChildren,
                ];
            }

            // Scriptures
            if ($condition->scriptures->isNotEmpty()) {
                $scrChildren = [];
                foreach ($condition->scriptures as $scripture) {
                    $linkedScriptureIds->push($scripture->id);
                    $scrChildren[] = [
                        'content' => '<span style="color:'.self::NODE_COLORS['scripture'].'">'.e($scripture->reference).'</span>',
                        'payload' => ['type' => 'scripture', 'entityId' => $scripture->id],
                    ];
                }
                $condNode['children'][] = [
                    'content' => '<strong>Scriptures</strong> <span style="color:#6b7280;font-size:0.85em">('.$condition->scriptures->count().')</span>',
                    'children' => $scrChildren,
                ];
            }

            // Recipes
            if ($condition->recipes->isNotEmpty()) {
                $recChildren = [];
                foreach ($condition->recipes as $recipe) {
                    $linkedRecipeIds->push($recipe->id);
                    $recChildren[] = [
                        'content' => '<span style="color:'.self::NODE_COLORS['recipe'].'">'.e($recipe->title).'</span>',
                        'payload' => ['type' => 'recipe', 'entityId' => $recipe->id],
                    ];
                }
                $condNode['children'][] = [
                    'content' => '<strong>Recipes</strong> <span style="color:#6b7280;font-size:0.85em">('.$condition->recipes->count().')</span>',
                    'children' => $recChildren,
                ];
            }

            // EGW References
            if ($condition->egwReferences->isNotEmpty()) {
                $egwChildren = [];
                foreach ($condition->egwReferences as $egwRef) {
                    $linkedEgwIds->push($egwRef->id);
                    $egwChildren[] = [
                        'content' => '<span style="color:'.self::NODE_COLORS['egwReference'].'">'.e($egwRef->citation).'</span>',
                        'payload' => ['type' => 'egwReference', 'entityId' => $egwRef->id],
                    ];
                }
                $condNode['children'][] = [
                    'content' => '<strong>EGW References</strong> <span style="color:#6b7280;font-size:0.85em">('.$condition->egwReferences->count().')</span>',
                    'children' => $egwChildren,
                ];
            }

            if (! empty($condNode['children'])) {
                $conditionChildren[] = $condNode;
            } else {
                // Conditions with no relations still appear
                $conditionChildren[] = $condNode;
            }
        }

        // Build care domains branch
        $domainChildren = [];
        foreach ($careDomains as $domain) {
            $domainChildren[] = [
                'content' => '<span style="color:'.self::NODE_COLORS['careDomain'].'">'.e($domain->name).'</span> <span style="color:#6b7280;font-size:0.85em">('.$domain->interventions_count.' interventions)</span>',
                'payload' => ['type' => 'careDomain', 'entityId' => $domain->id],
            ];
        }

        // Unlinked resources
        $unlinkedChildren = [];

        $unlinkedScriptures = \App\Models\Scripture::whereNotIn('id', $linkedScriptureIds->unique())
            ->orderBy('reference')->get();
        if ($unlinkedScriptures->isNotEmpty()) {
            $scrNodes = [];
            foreach ($unlinkedScriptures as $s) {
                $scrNodes[] = [
                    'content' => '<span style="color:'.self::NODE_COLORS['scripture'].'">'.e($s->reference).'</span>',
                    'payload' => ['type' => 'scripture', 'entityId' => $s->id],
                ];
            }
            $unlinkedChildren[] = [
                'content' => '<strong>Scriptures</strong> <span style="color:#6b7280;font-size:0.85em">('.$unlinkedScriptures->count().')</span>',
                'children' => $scrNodes,
                'payload' => ['fold' => 1],
            ];
        }

        $unlinkedRecipes = \App\Models\Recipe::whereNotIn('id', $linkedRecipeIds->unique())
            ->orderBy('title')->get();
        if ($unlinkedRecipes->isNotEmpty()) {
            $recNodes = [];
            foreach ($unlinkedRecipes as $r) {
                $recNodes[] = [
                    'content' => '<span style="color:'.self::NODE_COLORS['recipe'].'">'.e($r->title).'</span>',
                    'payload' => ['type' => 'recipe', 'entityId' => $r->id],
                ];
            }
            $unlinkedChildren[] = [
                'content' => '<strong>Recipes</strong> <span style="color:#6b7280;font-size:0.85em">('.$unlinkedRecipes->count().')</span>',
                'children' => $recNodes,
                'payload' => ['fold' => 1],
            ];
        }

        $unlinkedEgw = \App\Models\EgwReference::whereNotIn('id', $linkedEgwIds->unique())
            ->orderBy('book')->orderBy('page_start')->get();
        if ($unlinkedEgw->isNotEmpty()) {
            $egwNodes = [];
            foreach ($unlinkedEgw as $e) {
                $egwNodes[] = [
                    'content' => '<span style="color:'.self::NODE_COLORS['egwReference'].'">'.e($e->citation).'</span>',
                    'payload' => ['type' => 'egwReference', 'entityId' => $e->id],
                ];
            }
            $unlinkedChildren[] = [
                'content' => '<strong>EGW References</strong> <span style="color:#6b7280;font-size:0.85em">('.$unlinkedEgw->count().')</span>',
                'children' => $egwNodes,
                'payload' => ['fold' => 1],
            ];
        }

        // Assemble root tree
        $tree = [
            'content' => '<strong style="font-size:1.2em">Lifestyle Medicine Knowledge Graph</strong>',
            'children' => [],
        ];

        if (! empty($conditionChildren)) {
            $tree['children'][] = [
                'content' => '<strong style="color:'.self::NODE_COLORS['condition'].'">Conditions</strong> <span style="color:#6b7280;font-size:0.85em">('.count($conditionChildren).')</span>',
                'children' => $conditionChildren,
            ];
        }

        if (! empty($domainChildren)) {
            $tree['children'][] = [
                'content' => '<strong style="color:'.self::NODE_COLORS['careDomain'].'">Care Domains</strong> <span style="color:#6b7280;font-size:0.85em">('.count($domainChildren).')</span>',
                'children' => $domainChildren,
            ];
        }

        if (! empty($unlinkedChildren)) {
            $tree['children'][] = [
                'content' => '<strong style="color:#94a3b8">Unlinked Resources</strong>',
                'children' => $unlinkedChildren,
                'payload' => ['fold' => 1],
            ];
        }

        return response()->json([
            'tree' => $tree,
            'stats' => [
                'conditions' => $conditions->count(),
                'interventions' => Intervention::count(),
                'careDomains' => $careDomains->count(),
                'scriptures' => \App\Models\Scripture::count(),
                'recipes' => \App\Models\Recipe::count(),
                'egwReferences' => \App\Models\EgwReference::count(),
            ],
        ]);
    }

    /**
     * Get the evidence badge color for a given strength level.
     */
    protected function evidenceBadgeColor(string $strength): string
    {
        return match ($strength) {
            'high' => '#059669',
            'moderate' => '#ca8a04',
            'emerging' => '#0ea5e9',
            'insufficient' => '#94a3b8',
            default => '#6b7280',
        };
    }

    /**
     * GET /api/v1/knowledge-graph/full
     *
     * @param  Request  $request  Query params: limit (max 100), page, edges (bool), types (comma-separated)
     * @return JsonResponse Nodes, edges, and pagination metadata
     */
    public function fullGraph(Request $request): JsonResponse
    {
        $limit = min((int) $request->get('limit', 50), 100);
        $page = max((int) $request->get('page', 1), 1);
        $includeEdges = $request->boolean('edges', true);

        // Validate types parameter against allowlist
        $nodeTypes = null;
        if ($request->get('types')) {
            $nodeTypes = array_values(array_intersect(
                explode(',', $request->get('types')),
                self::VALID_NODE_TYPES
            ));
            if (empty($nodeTypes)) {
                $nodeTypes = null;
            }
        }

        $nodes = [];
        $edges = [];
        $nodeIds = [];

        // Helper to check if type is requested
        $shouldInclude = fn ($type) => $nodeTypes === null || in_array($type, $nodeTypes);

        // Get counts via efficient COUNT queries (not loading all records)
        $stats = [
            'conditions' => $shouldInclude('condition') ? Condition::count() : 0,
            'interventions' => $shouldInclude('intervention') ? Intervention::count() : 0,
            'careDomains' => $shouldInclude('careDomain') ? \App\Models\CareDomain::count() : 0,
            'scriptures' => $shouldInclude('scripture') ? \App\Models\Scripture::count() : 0,
            'recipes' => $shouldInclude('recipe') ? \App\Models\Recipe::count() : 0,
            'egwReferences' => $shouldInclude('egwReference') ? \App\Models\EgwReference::count() : 0,
            'evidenceEntries' => 0,
            'references' => 0,
        ];

        // Calculate offset for cross-type pagination
        $offset = ($page - 1) * $limit;
        $remaining = $limit;
        $currentOffset = 0;

        // Fetch conditions — database-level pagination
        if ($shouldInclude('condition') && $remaining > 0) {
            $skipForType = max(0, $offset - $currentOffset);
            if ($skipForType < $stats['conditions']) {
                $conditions = Condition::query()
                    ->orderBy('name')
                    ->skip($skipForType)
                    ->take($remaining)
                    ->get();

                foreach ($conditions as $condition) {
                    $nodes[] = $this->createConditionNode($condition);
                    $nodeIds["condition-{$condition->id}"] = true;
                    $remaining--;
                }
            }
            $currentOffset += $stats['conditions'];
        }

        // Fetch interventions — database-level pagination
        if ($shouldInclude('intervention') && $remaining > 0) {
            $skipForType = max(0, $offset - $currentOffset);
            if ($skipForType < $stats['interventions']) {
                $interventions = Intervention::with('careDomain')
                    ->orderBy('name')
                    ->skip($skipForType)
                    ->take($remaining)
                    ->get();

                foreach ($interventions as $intervention) {
                    $nodes[] = $this->createInterventionNode($intervention);
                    $nodeIds["intervention-{$intervention->id}"] = true;
                    $remaining--;
                }
            }
            $currentOffset += $stats['interventions'];
        }

        // Fetch care domains — database-level pagination
        if ($shouldInclude('careDomain') && $remaining > 0) {
            $skipForType = max(0, $offset - $currentOffset);
            if ($skipForType < $stats['careDomains']) {
                $careDomains = \App\Models\CareDomain::orderBy('name')
                    ->skip($skipForType)
                    ->take($remaining)
                    ->get();

                foreach ($careDomains as $domain) {
                    $nodes[] = $this->createCareDomainNode($domain);
                    $nodeIds["careDomain-{$domain->id}"] = true;
                    $remaining--;
                }
            }
            $currentOffset += $stats['careDomains'];
        }

        // Fetch scriptures — database-level pagination
        if ($shouldInclude('scripture') && $remaining > 0) {
            $skipForType = max(0, $offset - $currentOffset);
            if ($skipForType < $stats['scriptures']) {
                $scriptures = \App\Models\Scripture::orderBy('reference')
                    ->skip($skipForType)
                    ->take($remaining)
                    ->get();

                foreach ($scriptures as $scripture) {
                    $nodes[] = $this->createScriptureNode($scripture);
                    $nodeIds["scripture-{$scripture->id}"] = true;
                    $remaining--;
                }
            }
            $currentOffset += $stats['scriptures'];
        }

        // Fetch recipes — database-level pagination
        if ($shouldInclude('recipe') && $remaining > 0) {
            $skipForType = max(0, $offset - $currentOffset);
            if ($skipForType < $stats['recipes']) {
                $recipes = \App\Models\Recipe::orderBy('title')
                    ->skip($skipForType)
                    ->take($remaining)
                    ->get();

                foreach ($recipes as $recipe) {
                    $nodes[] = $this->createRecipeNode($recipe);
                    $nodeIds["recipe-{$recipe->id}"] = true;
                    $remaining--;
                }
            }
            $currentOffset += $stats['recipes'];
        }

        // Fetch EGW references — database-level pagination
        if ($shouldInclude('egwReference') && $remaining > 0) {
            $skipForType = max(0, $offset - $currentOffset);
            if ($skipForType < $stats['egwReferences']) {
                $egwRefs = \App\Models\EgwReference::orderBy('citation')
                    ->skip($skipForType)
                    ->take($remaining)
                    ->get();

                foreach ($egwRefs as $egwRef) {
                    $nodes[] = $this->createEgwReferenceNode($egwRef);
                    $nodeIds["egwReference-{$egwRef->id}"] = true;
                    $remaining--;
                }
            }
            $currentOffset += $stats['egwReferences'];
        }

        // Fetch edges only for visible nodes (scoped queries, not full table scans)
        if ($includeEdges && count($nodeIds) > 0) {
            // Extract entity IDs by type from visible nodes
            $visibleIds = $this->extractVisibleIds($nodeIds);

            // Condition-Intervention edges (only for visible nodes)
            if (! empty($visibleIds['condition']) && ! empty($visibleIds['intervention'])) {
                $conditionInterventions = \DB::table('condition_interventions')
                    ->whereIn('condition_id', $visibleIds['condition'])
                    ->whereIn('intervention_id', $visibleIds['intervention'])
                    ->get();

                foreach ($conditionInterventions as $pivot) {
                    $edges[] = [
                        'id' => "edge-cond-int-{$pivot->condition_id}-{$pivot->intervention_id}",
                        'source' => "condition-{$pivot->condition_id}",
                        'target' => "intervention-{$pivot->intervention_id}",
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

            // Intervention-CareDomain edges (only for visible nodes)
            if (! empty($visibleIds['intervention']) && ! empty($visibleIds['careDomain'])) {
                $interventionsWithDomain = Intervention::whereIn('id', $visibleIds['intervention'])
                    ->whereIn('care_domain_id', $visibleIds['careDomain'])
                    ->whereNotNull('care_domain_id')
                    ->get(['id', 'care_domain_id']);

                foreach ($interventionsWithDomain as $intervention) {
                    $edges[] = [
                        'id' => "edge-domain-int-{$intervention->care_domain_id}-{$intervention->id}",
                        'source' => "careDomain-{$intervention->care_domain_id}",
                        'target' => "intervention-{$intervention->id}",
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['careDomain'], 'strokeWidth' => 2],
                    ];
                }
            }

            // Scripture relationships (only for visible nodes)
            if (! empty($visibleIds['condition']) && ! empty($visibleIds['scripture'])) {
                $conditionScriptures = \DB::table('condition_scripture')
                    ->whereIn('condition_id', $visibleIds['condition'])
                    ->whereIn('scripture_id', $visibleIds['scripture'])
                    ->get();

                foreach ($conditionScriptures as $pivot) {
                    $edges[] = [
                        'id' => "edge-cond-scr-{$pivot->condition_id}-{$pivot->scripture_id}",
                        'source' => "condition-{$pivot->condition_id}",
                        'target' => "scripture-{$pivot->scripture_id}",
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['scripture'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
                    ];
                }
            }

            // Recipe relationships (only for visible nodes)
            if (! empty($visibleIds['condition']) && ! empty($visibleIds['recipe'])) {
                $conditionRecipes = \DB::table('condition_recipe')
                    ->whereIn('condition_id', $visibleIds['condition'])
                    ->whereIn('recipe_id', $visibleIds['recipe'])
                    ->get();

                foreach ($conditionRecipes as $pivot) {
                    $edges[] = [
                        'id' => "edge-cond-rec-{$pivot->condition_id}-{$pivot->recipe_id}",
                        'source' => "condition-{$pivot->condition_id}",
                        'target' => "recipe-{$pivot->recipe_id}",
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['recipe'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
                    ];
                }
            }

            // EGW Reference relationships (only for visible nodes)
            if (! empty($visibleIds['condition']) && ! empty($visibleIds['egwReference'])) {
                $conditionEgw = \DB::table('condition_egw_reference')
                    ->whereIn('condition_id', $visibleIds['condition'])
                    ->whereIn('egw_reference_id', $visibleIds['egwReference'])
                    ->get();

                foreach ($conditionEgw as $pivot) {
                    $edges[] = [
                        'id' => "edge-cond-egw-{$pivot->condition_id}-{$pivot->egw_reference_id}",
                        'source' => "condition-{$pivot->condition_id}",
                        'target' => "egwReference-{$pivot->egw_reference_id}",
                        'type' => 'default',
                        'style' => ['stroke' => self::NODE_COLORS['egwReference'], 'strokeWidth' => 1, 'strokeDasharray' => '5,5'],
                    ];
                }
            }
        }

        // Calculate totals
        $totalNodes = array_sum($stats);
        $totalPages = $totalNodes > 0 ? (int) ceil($totalNodes / $limit) : 1;

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

    /**
     * Extract entity IDs by type from the visible nodeIds map.
     */
    /**
     * Extract entity IDs grouped by type from the visible node ID map.
     *
     * Parses composite node IDs (e.g., "condition-uuid") into a type-keyed array
     * of raw entity UUIDs for efficient database queries.
     *
     * @param  array  $nodeIds  Map of composite node IDs to boolean presence flags
     * @return array Associative array keyed by entity type with arrays of UUID strings
     */
    protected function extractVisibleIds(array $nodeIds): array
    {
        $visibleIds = [];
        $prefixMap = [
            'condition-' => 'condition',
            'intervention-' => 'intervention',
            'careDomain-' => 'careDomain',
            'scripture-' => 'scripture',
            'recipe-' => 'recipe',
            'egwReference-' => 'egwReference',
        ];

        foreach (array_keys($nodeIds) as $nodeId) {
            foreach ($prefixMap as $prefix => $type) {
                if (str_starts_with($nodeId, $prefix)) {
                    $visibleIds[$type][] = substr($nodeId, strlen($prefix));
                    break;
                }
            }
        }

        return $visibleIds;
    }

    // ==================== Node Creators ====================

    /**
     * Create a React Flow node for a condition entity.
     *
     * @param  Condition  $condition  The condition model instance
     * @param  bool  $isCenter  Whether this is the center/focus node
     * @return array React Flow node data structure
     */
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
                'snomedCode' => $condition->snomed_code,
                'icd10Code' => $condition->icd10_code,
                'bodySystem' => $condition->bodySystem ? [
                    'id' => $condition->bodySystem->id,
                    'name' => $condition->bodySystem->name,
                    'icon' => $condition->bodySystem->icon,
                    'color' => $condition->bodySystem->color,
                ] : null,
                'isCenter' => $isCenter,
                'color' => self::NODE_COLORS['condition'],
            ],
        ];
    }

    /**
     * Create a React Flow node for an intervention entity.
     *
     * @param  Intervention  $intervention  The intervention model instance
     * @param  bool  $isCenter  Whether this is the center/focus node
     * @return array React Flow node data structure
     */
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

    /**
     * Create a React Flow node for a care domain entity.
     *
     * @param  CareDomain  $careDomain  The care domain model instance
     * @return array React Flow node data structure
     */
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

    /**
     * Create a React Flow node for a scripture entity.
     *
     * @param  Scripture  $scripture  The scripture model instance
     * @return array React Flow node data structure
     */
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

    /**
     * Create a React Flow node for a recipe entity.
     *
     * @param  Recipe  $recipe  The recipe model instance
     * @return array React Flow node data structure
     */
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

    /**
     * Create a React Flow node for an EGW reference entity.
     *
     * @param  EgwReference  $egwRef  The EGW reference model instance
     * @return array React Flow node data structure
     */
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

    /**
     * Create a React Flow node for an evidence entry entity.
     *
     * @param  EvidenceEntry  $evidence  The evidence entry model instance
     * @return array React Flow node data structure
     */
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

    /**
     * Create a React Flow node for a reference (citation) entity.
     *
     * @param  Reference  $reference  The reference model instance
     * @return array React Flow node data structure
     */
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

    /**
     * Create a React Flow edge between a condition and intervention.
     *
     * Edge styling is based on evidence strength and effectiveness rating.
     * High evidence or very high effectiveness triggers edge animation.
     *
     * @param  Condition  $condition  The condition model instance
     * @param  Intervention  $intervention  The intervention model (with pivot)
     * @param  InterventionEffectiveness|null  $effectiveness  Optional effectiveness rating
     * @return array React Flow edge data structure
     */
    protected function createConditionInterventionEdge($condition, $intervention, $effectiveness = null): array
    {
        $pivot = $intervention->pivot;
        $strength = $pivot?->strength_of_evidence ?? 'emerging';
        $recommendation = $pivot?->recommendation_level ?? 'optional';

        // Get effectiveness rating if available
        $effectivenessData = null;
        if ($effectiveness) {
            $effectivenessData = [
                'rating' => $effectiveness->effectiveness_rating,
                'evidenceGrade' => $effectiveness->evidence_grade,
                'isPrimary' => $effectiveness->is_primary,
                'score' => $effectiveness->effectiveness_score,
            ];
        }

        return [
            'id' => "edge-cond-int-{$condition->id}-{$intervention->id}",
            'source' => "condition-{$condition->id}",
            'target' => "intervention-{$intervention->id}",
            'type' => 'condition-intervention', // Custom edge type with metadata display
            'animated' => $strength === 'high' || ($effectiveness && $effectiveness->effectiveness_rating === 'very_high'),
            'data' => [
                'strengthOfEvidence' => $strength,
                'recommendationLevel' => $recommendation,
                'clinicalNotes' => $pivot?->clinical_notes,
                'effectiveness' => $effectivenessData,
            ],
            'style' => $effectivenessData ? [
                'stroke' => self::EFFECTIVENESS_COLORS[$effectiveness->effectiveness_rating] ?? '#94a3b8',
                'strokeWidth' => $effectiveness->is_primary ? 3 : 2,
            ] : null,
        ];
    }

    /**
     * Create an edge for intervention relationships (synergies/conflicts).
     */
    protected function createInterventionRelationshipEdge($relationship): array
    {
        $type = $relationship->relationship_type;
        $isPositive = in_array($type, ['synergy', 'complementary']);
        $isNegative = in_array($type, ['caution', 'conflict']);

        return [
            'id' => "edge-int-rel-{$relationship->id}",
            'source' => "intervention-{$relationship->intervention_a_id}",
            'target' => "intervention-{$relationship->intervention_b_id}",
            'type' => 'intervention-relationship',
            'animated' => $type === 'synergy',
            'data' => [
                'relationshipType' => $type,
                'isPositive' => $isPositive,
                'isNegative' => $isNegative,
                'description' => $relationship->description,
                'clinicalNotes' => $relationship->clinical_notes,
            ],
            'style' => [
                'stroke' => self::RELATIONSHIP_COLORS[$type] ?? '#94a3b8',
                'strokeWidth' => ($type === 'synergy' || $type === 'conflict') ? 3 : 2,
                'strokeDasharray' => $isNegative ? '5,5' : null,
            ],
        ];
    }
}
