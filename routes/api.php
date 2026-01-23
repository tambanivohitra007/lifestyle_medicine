<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CareDomainController;
use App\Http\Controllers\Api\ConditionController;
use App\Http\Controllers\Api\ConditionSectionController;
use App\Http\Controllers\Api\ContentTagController;
use App\Http\Controllers\Api\EvidenceEntryController;
use App\Http\Controllers\Api\InterventionController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\ScriptureController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
    Route::put('/profile', [AuthController::class, 'updateProfile'])->middleware('auth:sanctum');
    Route::put('/password', [AuthController::class, 'updatePassword'])->middleware('auth:sanctum');
});

// Public API routes (read-only)
Route::prefix('v1')->group(function () {

    // Care Domains
    Route::apiResource('care-domains', CareDomainController::class)->only(['index', 'show']);

    // Conditions
    Route::apiResource('conditions', ConditionController::class)->only(['index', 'show']);
    Route::get('conditions/{condition}/sections', [ConditionController::class, 'sections']);
    Route::get('conditions/{condition}/interventions', [ConditionController::class, 'interventions']);
    Route::get('conditions/{condition}/scriptures', [ConditionController::class, 'scriptures']);
    Route::get('conditions/{condition}/recipes', [ConditionController::class, 'recipes']);

    // Interventions
    Route::apiResource('interventions', InterventionController::class)->only(['index', 'show']);
    Route::get('interventions/{intervention}/evidence', [InterventionController::class, 'evidence']);
    Route::get('interventions/{intervention}/conditions', [InterventionController::class, 'conditions']);

    // Evidence & References
    Route::apiResource('evidence-entries', EvidenceEntryController::class)->only(['index', 'show']);
    Route::apiResource('references', ReferenceController::class)->only(['index', 'show']);

    // Scriptures & Recipes
    Route::apiResource('scriptures', ScriptureController::class)->only(['index', 'show']);
    Route::apiResource('recipes', RecipeController::class)->only(['index', 'show']);

    // Content Tags
    Route::apiResource('content-tags', ContentTagController::class)->only(['index', 'show']);
});

// Admin API routes (full CRUD) - protected by auth:sanctum
Route::prefix('v1/admin')->middleware('auth:sanctum')->group(function () {

    // Care Domains
    Route::apiResource('care-domains', CareDomainController::class)->except(['index', 'show']);

    // Conditions
    Route::apiResource('conditions', ConditionController::class)->except(['index', 'show']);
    Route::apiResource('condition-sections', ConditionSectionController::class);

    // Interventions
    Route::apiResource('interventions', InterventionController::class)->except(['index', 'show']);

    // Evidence & References
    Route::apiResource('evidence-entries', EvidenceEntryController::class)->except(['index', 'show']);
    Route::apiResource('references', ReferenceController::class)->except(['index', 'show']);

    // Scriptures & Recipes
    Route::apiResource('scriptures', ScriptureController::class)->except(['index', 'show']);
    Route::apiResource('recipes', RecipeController::class)->except(['index', 'show']);

    // Content Tags
    Route::apiResource('content-tags', ContentTagController::class)->except(['index', 'show']);

    // Relationship management endpoints
    Route::post('conditions/{condition}/interventions/{intervention}', [ConditionController::class, 'attachIntervention']);
    Route::delete('conditions/{condition}/interventions/{intervention}', [ConditionController::class, 'detachIntervention']);
    Route::post('conditions/{condition}/scriptures/{scripture}', [ConditionController::class, 'attachScripture']);
    Route::delete('conditions/{condition}/scriptures/{scripture}', [ConditionController::class, 'detachScripture']);
    Route::post('conditions/{condition}/recipes/{recipe}', [ConditionController::class, 'attachRecipe']);
    Route::delete('conditions/{condition}/recipes/{recipe}', [ConditionController::class, 'detachRecipe']);
});
