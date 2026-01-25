<?php

use App\Http\Controllers\Api\AiContentController;
use App\Http\Controllers\Api\AiSuggestionController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BibleController;
use App\Http\Controllers\Api\CareDomainController;
use App\Http\Controllers\Api\ConditionController;
use App\Http\Controllers\Api\ConditionSectionController;
use App\Http\Controllers\Api\ContentTagController;
use App\Http\Controllers\Api\EgwReferenceController;
use App\Http\Controllers\Api\EvidenceEntryController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\InterventionController;
use App\Http\Controllers\Api\KnowledgeGraphController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\ScriptureController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\MediaController;
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

    // Conditions
    Route::apiResource('conditions', ConditionController::class)->only(['index', 'show']);
    Route::get('conditions/{condition}/sections', [ConditionController::class, 'sections']);
    Route::get('conditions/{condition}/interventions', [ConditionController::class, 'interventions']);
    Route::get('conditions/{condition}/scriptures', [ConditionController::class, 'scriptures']);
    Route::get('conditions/{condition}/recipes', [ConditionController::class, 'recipes']);
    Route::get('conditions/{condition}/egw-references', [ConditionController::class, 'egwReferences']);

    // Interventions
    Route::apiResource('interventions', InterventionController::class)->only(['index', 'show']);
    Route::get('interventions/{intervention}/evidence', [InterventionController::class, 'evidence']);
    Route::get('interventions/{intervention}/conditions', [InterventionController::class, 'conditions']);
    Route::get('interventions/{intervention}/media', [MediaController::class, 'index']);

    // Evidence & References
    Route::apiResource('evidence-entries', EvidenceEntryController::class)->only(['index', 'show']);
    Route::apiResource('references', ReferenceController::class)->only(['index', 'show']);

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
    });
});

// Admin API routes - Content Management (admin and editor roles)
Route::prefix('v1/admin')->middleware(['auth:sanctum', 'role:admin,editor'])->group(function () {

    // Care Domains
    Route::apiResource('care-domains', CareDomainController::class)->except(['index', 'show']);

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

    // Evidence & References
    Route::apiResource('evidence-entries', EvidenceEntryController::class)->except(['index', 'show']);
    Route::apiResource('references', ReferenceController::class)->except(['index', 'show']);

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
    });

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
