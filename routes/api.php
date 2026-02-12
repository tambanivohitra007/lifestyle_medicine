<?php

use App\Http\Controllers\Api\AiContentController;
use App\Http\Controllers\Api\AiSuggestionController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BibleController;
use App\Http\Controllers\Api\BodySystemController;
use App\Http\Controllers\Api\CareDomainController;
use App\Http\Controllers\Api\ConditionController;
use App\Http\Controllers\Api\ConditionMediaController;
use App\Http\Controllers\Api\ConditionMindmapController;
use App\Http\Controllers\Api\ConditionSectionController;
use App\Http\Controllers\Api\ContentTagController;
use App\Http\Controllers\Api\EgwReferenceController;
use App\Http\Controllers\Api\EvidenceEntryController;
use App\Http\Controllers\Api\EvidenceSummaryController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\InfographicController;
use App\Http\Controllers\Api\InterventionController;
use App\Http\Controllers\Api\InterventionEffectivenessController;
use App\Http\Controllers\Api\InterventionProtocolController;
use App\Http\Controllers\Api\InterventionRelationshipController;
use App\Http\Controllers\Api\KnowledgeGraphController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\ScriptureController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
    Route::put('/profile', [AuthController::class, 'updateProfile'])->middleware('auth:sanctum');
    Route::put('/password', [AuthController::class, 'updatePassword'])->middleware('auth:sanctum');
});

// Public API routes (read-only) - rate limited to 60 requests/minute
Route::prefix('v1')->middleware('throttle:api')->group(function () {

    // Global Search
    Route::get('/search', [SearchController::class, 'search']);

    // Bible Explorer API
    Route::prefix('bible')->group(function () {
        Route::get('/lookup', [BibleController::class, 'lookup']);
        Route::get('/search', [BibleController::class, 'search']);
        Route::get('/translations', [BibleController::class, 'getTranslations']);
        Route::get('/bibles', [BibleController::class, 'getBibles']);
        Route::get('/books', [BibleController::class, 'getBooks']);
        Route::get('/chapter', [BibleController::class, 'getChapter']);
        Route::get('/daily-verse', [BibleController::class, 'getDailyVerse']);
        Route::get('/health-themes', [BibleController::class, 'getHealthThemes']);
        Route::get('/health-themes/{themeKey}', [BibleController::class, 'getThemeVerses']);
        Route::get('/search-health', [BibleController::class, 'searchHealthVerses']);
    });

    // Care Domains
    Route::apiResource('care-domains', CareDomainController::class)->only(['index', 'show']);

    // Body Systems (medical ontology)
    Route::get('body-systems', [BodySystemController::class, 'index']);
    Route::get('body-systems/{bodySystem}', [BodySystemController::class, 'show']);
    Route::get('body-systems/{bodySystem}/categories', [BodySystemController::class, 'categories']);

    // Conditions
    Route::apiResource('conditions', ConditionController::class)->only(['index', 'show']);
    Route::get('conditions/{condition}/complete', [ConditionController::class, 'complete']); // All data in one request
    Route::get('conditions/{condition}/sections', [ConditionController::class, 'sections']);
    Route::get('conditions/{condition}/interventions', [ConditionController::class, 'interventions']);
    Route::get('conditions/{condition}/scriptures', [ConditionController::class, 'scriptures']);
    Route::get('conditions/{condition}/recipes', [ConditionController::class, 'recipes']);
    Route::get('conditions/{condition}/egw-references', [ConditionController::class, 'egwReferences']);
    Route::get('conditions/{condition}/media', [ConditionMediaController::class, 'index']);

    // Interventions
    Route::apiResource('interventions', InterventionController::class)->only(['index', 'show']);
    Route::get('interventions/{intervention}/evidence', [InterventionController::class, 'evidence']);
    Route::get('interventions/{intervention}/conditions', [InterventionController::class, 'conditions']);
    Route::get('interventions/{intervention}/media', [MediaController::class, 'index']);

    // Intervention Protocols (read-only)
    Route::get('interventions/{intervention}/protocol', [InterventionProtocolController::class, 'show']);
    Route::get('interventions/{intervention}/contraindications', [InterventionProtocolController::class, 'contraindications']);
    Route::get('interventions/{intervention}/outcomes', [InterventionProtocolController::class, 'outcomes']);

    // Intervention Effectiveness (read-only)
    Route::get('effectiveness', [InterventionEffectivenessController::class, 'index']);
    Route::get('conditions/{condition}/effectiveness', [InterventionEffectivenessController::class, 'forCondition']);
    Route::get('interventions/{intervention}/effectiveness', [InterventionEffectivenessController::class, 'forIntervention']);
    Route::get('conditions/{condition}/interventions/{intervention}/effectiveness', [InterventionEffectivenessController::class, 'forPair']);

    // Intervention Relationships (read-only)
    Route::get('intervention-relationships', [InterventionRelationshipController::class, 'index']);
    Route::get('interventions/{intervention}/relationships', [InterventionRelationshipController::class, 'forIntervention']);
    Route::get('interventions/{intervention}/synergies', [InterventionRelationshipController::class, 'synergies']);
    Route::get('interventions/{intervention}/conflicts', [InterventionRelationshipController::class, 'conflicts']);

    // Evidence & References
    Route::apiResource('evidence-entries', EvidenceEntryController::class)->only(['index', 'show']);
    Route::apiResource('references', ReferenceController::class)->only(['index', 'show']);

    // Evidence Summaries (public read-only)
    Route::get('evidence-summaries', [EvidenceSummaryController::class, 'index']);
    Route::get('evidence-summaries/{evidenceSummary}', [EvidenceSummaryController::class, 'show']);
    Route::get('conditions/{condition}/evidence-summaries', [EvidenceSummaryController::class, 'forCondition']);
    Route::get('interventions/{intervention}/evidence-summaries', [EvidenceSummaryController::class, 'forIntervention']);
    Route::get('conditions/{condition}/interventions/{intervention}/evidence-summary', [EvidenceSummaryController::class, 'forPair']);

    // Scriptures & Recipes
    Route::apiResource('scriptures', ScriptureController::class)->only(['index', 'show']);
    Route::apiResource('recipes', RecipeController::class)->only(['index', 'show']);

    // EGW References
    Route::apiResource('egw-references', EgwReferenceController::class)->only(['index', 'show']);
    Route::get('egw-references-books', [EgwReferenceController::class, 'books']);
    Route::get('egw-references-topics', [EgwReferenceController::class, 'topics']);

    // Knowledge Graph
    Route::get('knowledge-graph/full', [KnowledgeGraphController::class, 'fullGraph']);
    Route::get('knowledge-graph/condition/{condition}', [KnowledgeGraphController::class, 'conditionGraph']);
    Route::get('knowledge-graph/intervention/{intervention}', [KnowledgeGraphController::class, 'interventionGraph']);
    Route::get('egw-references-abbreviations', [EgwReferenceController::class, 'abbreviations']);

    // Condition Mindmap (public read-only)
    Route::get('conditions/{condition}/mindmap', [ConditionMindmapController::class, 'show']);
    Route::get('conditions/{condition}/risk-factors', [ConditionMindmapController::class, 'riskFactors']);
    Route::get('conditions/{condition}/complications', [ConditionMindmapController::class, 'complications']);

    // Content Tags
    Route::apiResource('content-tags', ContentTagController::class)->only(['index', 'show']);

    // PDF Exports (public) - rate limited to 10 requests/minute
    Route::middleware('throttle:export')->group(function () {
        Route::get('export/conditions/{condition}/pdf', [ExportController::class, 'conditionPdf']);
        Route::get('export/conditions/summary/pdf', [ExportController::class, 'conditionsSummaryPdf']);
        Route::get('export/recipes/{recipe}/pdf', [ExportController::class, 'recipePdf']);

        // CSV Exports (public)
        Route::get('export/evidence/csv', [ExportController::class, 'evidenceCsv']);
        Route::get('export/references/csv', [ExportController::class, 'referencesCsv']);

        // FHIR R4 Exports (public)
        Route::get('export/fhir/metadata', [ExportController::class, 'fhirCapabilityStatement']);
        Route::get('export/fhir/PlanDefinition/{condition}', [ExportController::class, 'conditionFhir']);
        Route::get('export/fhir/ActivityDefinition/{intervention}', [ExportController::class, 'interventionFhir']);
    });
});

// Admin API routes - Content Management (admin and editor roles)
Route::prefix('v1/admin')->middleware(['auth:sanctum', 'role:admin,editor'])->group(function () {

    // Care Domains
    Route::apiResource('care-domains', CareDomainController::class)->except(['index', 'show']);

    // Body Systems
    Route::apiResource('body-systems', BodySystemController::class)->except(['index', 'show']);
    Route::post('body-systems/{bodySystem}/categories', [BodySystemController::class, 'storeCategory']);
    Route::put('condition-categories/{category}', [BodySystemController::class, 'updateCategory']);
    Route::delete('condition-categories/{category}', [BodySystemController::class, 'destroyCategory']);

    // Intervention Effectiveness
    Route::post('effectiveness', [InterventionEffectivenessController::class, 'store']);
    Route::put('effectiveness/{effectiveness}', [InterventionEffectivenessController::class, 'update']);
    Route::delete('effectiveness/{effectiveness}', [InterventionEffectivenessController::class, 'destroy']);

    // Intervention Relationships
    Route::post('intervention-relationships', [InterventionRelationshipController::class, 'store']);
    Route::put('intervention-relationships/{relationship}', [InterventionRelationshipController::class, 'update']);
    Route::delete('intervention-relationships/{relationship}', [InterventionRelationshipController::class, 'destroy']);

    // Conditions
    Route::apiResource('conditions', ConditionController::class)->except(['index', 'show']);
    Route::apiResource('condition-sections', ConditionSectionController::class);

    // Interventions
    Route::apiResource('interventions', InterventionController::class)->except(['index', 'show']);

    // Intervention Media
    Route::post('interventions/{intervention}/media', [MediaController::class, 'store']);
    Route::put('interventions/{intervention}/media/{medium}', [MediaController::class, 'update']);
    Route::post('interventions/{intervention}/media/reorder', [MediaController::class, 'reorder']);
    Route::delete('interventions/{intervention}/media/{medium}', [MediaController::class, 'destroy']);

    // Condition Media
    Route::post('conditions/{condition}/media', [ConditionMediaController::class, 'store']);
    Route::put('conditions/{condition}/media/{medium}', [ConditionMediaController::class, 'update']);
    Route::post('conditions/{condition}/media/reorder', [ConditionMediaController::class, 'reorder']);
    Route::delete('conditions/{condition}/media/{medium}', [ConditionMediaController::class, 'destroy']);

    // Intervention Protocols
    Route::put('interventions/{intervention}/protocol', [InterventionProtocolController::class, 'storeOrUpdateProtocol']);
    Route::delete('interventions/{intervention}/protocol', [InterventionProtocolController::class, 'destroyProtocol']);

    // Protocol Steps
    Route::post('interventions/{intervention}/protocol/steps', [InterventionProtocolController::class, 'storeStep']);
    Route::post('interventions/{intervention}/protocol/steps/reorder', [InterventionProtocolController::class, 'reorderSteps']);
    Route::put('protocol-steps/{step}', [InterventionProtocolController::class, 'updateStep']);
    Route::delete('protocol-steps/{step}', [InterventionProtocolController::class, 'destroyStep']);

    // Intervention Contraindications
    Route::post('interventions/{intervention}/contraindications', [InterventionProtocolController::class, 'storeContraindication']);
    Route::put('contraindications/{contraindication}', [InterventionProtocolController::class, 'updateContraindication']);
    Route::delete('contraindications/{contraindication}', [InterventionProtocolController::class, 'destroyContraindication']);

    // Intervention Outcomes
    Route::post('interventions/{intervention}/outcomes', [InterventionProtocolController::class, 'storeOutcome']);
    Route::post('interventions/{intervention}/outcomes/reorder', [InterventionProtocolController::class, 'reorderOutcomes']);
    Route::put('outcomes/{outcome}', [InterventionProtocolController::class, 'updateOutcome']);
    Route::delete('outcomes/{outcome}', [InterventionProtocolController::class, 'destroyOutcome']);

    // Evidence & References
    Route::apiResource('evidence-entries', EvidenceEntryController::class)->except(['index', 'show']);
    Route::apiResource('references', ReferenceController::class)->except(['index', 'show']);

    // Evidence Summaries (CRUD)
    Route::apiResource('evidence-summaries', EvidenceSummaryController::class)->except(['index', 'show']);
    Route::get('evidence-summaries/needs-review', [EvidenceSummaryController::class, 'needingReview']);
    Route::post('evidence-summaries/{evidenceSummary}/mark-reviewed', [EvidenceSummaryController::class, 'markReviewed']);

    // Scriptures & Recipes
    Route::apiResource('scriptures', ScriptureController::class)->except(['index', 'show']);
    Route::apiResource('recipes', RecipeController::class)->except(['index', 'show']);

    // EGW References
    Route::apiResource('egw-references', EgwReferenceController::class)->except(['index', 'show']);

    // Content Tags
    Route::apiResource('content-tags', ContentTagController::class)->except(['index', 'show']);

    // Relationship management endpoints
    // Note: reorder route must come BEFORE parameterized routes to avoid 'reorder' being matched as {intervention}
    Route::post('conditions/{condition}/interventions/reorder', [ConditionController::class, 'reorderInterventions']);
    Route::post('conditions/{condition}/interventions/{intervention}', [ConditionController::class, 'attachIntervention']);
    Route::put('conditions/{condition}/interventions/{intervention}', [ConditionController::class, 'updateIntervention']);
    Route::delete('conditions/{condition}/interventions/{intervention}', [ConditionController::class, 'detachIntervention']);
    Route::post('conditions/{condition}/scriptures/{scripture}', [ConditionController::class, 'attachScripture']);
    Route::delete('conditions/{condition}/scriptures/{scripture}', [ConditionController::class, 'detachScripture']);
    Route::post('conditions/{condition}/recipes/{recipe}', [ConditionController::class, 'attachRecipe']);
    Route::delete('conditions/{condition}/recipes/{recipe}', [ConditionController::class, 'detachRecipe']);
    Route::post('conditions/{condition}/egw-references/{egwReference}', [ConditionController::class, 'attachEgwReference']);
    Route::delete('conditions/{condition}/egw-references/{egwReference}', [ConditionController::class, 'detachEgwReference']);

    // Condition Risk Factors CRUD
    Route::post('conditions/{condition}/risk-factors', [ConditionMindmapController::class, 'storeRiskFactor']);
    Route::put('conditions/{condition}/risk-factors/{riskFactor}', [ConditionMindmapController::class, 'updateRiskFactor']);
    Route::delete('conditions/{condition}/risk-factors/{riskFactor}', [ConditionMindmapController::class, 'destroyRiskFactor']);

    // Condition Complications CRUD
    Route::post('conditions/{condition}/complications', [ConditionMindmapController::class, 'storeComplication']);
    Route::put('conditions/{condition}/complications/{complication}', [ConditionMindmapController::class, 'updateComplication']);
    Route::delete('conditions/{condition}/complications/{complication}', [ConditionMindmapController::class, 'destroyComplication']);

    // AI Suggestions (for content editors) - rate limited to 10 requests/minute
    Route::middleware('throttle:ai')->group(function () {
        Route::post('ai/suggest-scriptures', [AiSuggestionController::class, 'suggestScriptures']);
        Route::post('ai/suggest-egw-references', [AiSuggestionController::class, 'suggestEgwReferences']);
    });
});

// Admin API routes - Admin Only (user management, import, AI generator, analytics)
Route::prefix('v1/admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // Data Import (admin only)
    Route::post('import/conditions', [ImportController::class, 'importConditions']);
    Route::post('import/interventions', [ImportController::class, 'importInterventions']);
    Route::get('import/templates', [ImportController::class, 'getTemplates']);

    // User Management (admin only)
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    Route::post('users/{id}/restore', [UserController::class, 'restore']);

    // AI Content Generator (admin only) - rate limited to 10 requests/minute
    Route::middleware('throttle:ai')->group(function () {
        Route::get('ai/status', [AiContentController::class, 'status']);
        Route::post('ai/generate-draft', [AiContentController::class, 'generateDraft']);
        Route::post('ai/structure-content', [AiContentController::class, 'structureContent']);
        Route::post('ai/import-content', [AiContentController::class, 'importContent']);

        // Infographic Generation - rate limited actions only
        Route::post('conditions/{condition}/infographics/generate', [InfographicController::class, 'generate']);
        Route::post('infographics/{infographic}/retry', [InfographicController::class, 'retry']);
    });

    // AI request status polling (not rate limited, for polling)
    Route::get('ai/requests/{aiRequest}/status', [AiContentController::class, 'requestStatus']);

    // Infographic status endpoints - not rate limited (for polling)
    Route::get('infographics/status', [InfographicController::class, 'status']);
    Route::get('conditions/{condition}/infographics/status', [InfographicController::class, 'getStatus']);
    Route::get('conditions/{condition}/infographics', [InfographicController::class, 'index']);

    // Analytics (admin only)
    Route::prefix('analytics')->group(function () {
        Route::get('overview', [AnalyticsController::class, 'overview']);
        Route::get('conditions-by-category', [AnalyticsController::class, 'conditionsByCategory']);
        Route::get('interventions-by-domain', [AnalyticsController::class, 'interventionsByDomain']);
        Route::get('growth', [AnalyticsController::class, 'growth']);
        Route::get('user-activity', [AnalyticsController::class, 'userActivity']);
        Route::get('evidence-quality', [AnalyticsController::class, 'evidenceQuality']);
        Route::get('content-completeness', [AnalyticsController::class, 'contentCompleteness']);
        Route::get('export', [AnalyticsController::class, 'exportReport']);
    });
});
