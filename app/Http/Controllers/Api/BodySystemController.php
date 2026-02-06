<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BodySystemResource;
use App\Http\Resources\ConditionCategoryResource;
use App\Models\BodySystem;
use App\Models\ConditionCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class BodySystemController extends Controller
{
    /**
     * List all body systems.
     */
    public function index(): AnonymousResourceCollection
    {
        $systems = BodySystem::withCount('conditions')
            ->ordered()
            ->get();

        return BodySystemResource::collection($systems);
    }

    /**
     * Get a single body system with its categories.
     */
    public function show(BodySystem $bodySystem): BodySystemResource
    {
        $bodySystem->load(['categories', 'conditions']);
        $bodySystem->loadCount('conditions');

        return new BodySystemResource($bodySystem);
    }

    /**
     * Create a new body system (admin).
     */
    public function store(Request $request): BodySystemResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:body_systems,name',
            'snomed_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'display_order' => 'nullable|integer|min:0',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        if (!isset($validated['display_order'])) {
            $validated['display_order'] = BodySystem::max('display_order') + 1;
        }

        $bodySystem = BodySystem::create($validated);

        return new BodySystemResource($bodySystem);
    }

    /**
     * Update a body system (admin).
     */
    public function update(Request $request, BodySystem $bodySystem): BodySystemResource
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:body_systems,name,' . $bodySystem->id,
            'snomed_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'display_order' => 'nullable|integer|min:0',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $bodySystem->update($validated);

        return new BodySystemResource($bodySystem);
    }

    /**
     * Delete a body system (admin).
     */
    public function destroy(BodySystem $bodySystem): Response
    {
        $bodySystem->delete();

        return response()->noContent();
    }

    // ==================== CATEGORIES ====================

    /**
     * Get categories for a body system.
     */
    public function categories(BodySystem $bodySystem): AnonymousResourceCollection
    {
        return ConditionCategoryResource::collection(
            $bodySystem->categories()->ordered()->get()
        );
    }

    /**
     * Create a category under a body system (admin).
     */
    public function storeCategory(Request $request, BodySystem $bodySystem): ConditionCategoryResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
        ]);

        $validated['body_system_id'] = $bodySystem->id;
        $validated['slug'] = Str::slug($validated['name']);

        if (!isset($validated['display_order'])) {
            $validated['display_order'] = $bodySystem->categories()->max('display_order') + 1;
        }

        $category = ConditionCategory::create($validated);

        return new ConditionCategoryResource($category);
    }

    /**
     * Update a category (admin).
     */
    public function updateCategory(Request $request, ConditionCategory $category): ConditionCategoryResource
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return new ConditionCategoryResource($category);
    }

    /**
     * Delete a category (admin).
     */
    public function destroyCategory(ConditionCategory $category): Response
    {
        $category->delete();

        return response()->noContent();
    }
}
