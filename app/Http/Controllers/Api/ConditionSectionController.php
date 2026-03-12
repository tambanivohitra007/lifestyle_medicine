<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConditionSectionResource;
use App\Models\ConditionSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Manages content sections within conditions (risk factors, physiology, solutions, etc.).
 *
 * Each condition can have multiple typed sections with rich text bodies
 * and configurable ordering. Section types: risk_factors, physiology,
 * complications, solutions, additional_factors, scripture.
 *
 * Routes: /api/v1/admin/condition-sections (admin CRUD)
 */
class ConditionSectionController extends Controller
{
    /**
     * List all condition sections across all conditions.
     *
     * GET /api/v1/admin/condition-sections
     *
     * @return AnonymousResourceCollection Paginated collection of ConditionSectionResource (20 per page)
     */
    public function index(): AnonymousResourceCollection
    {
        $sections = ConditionSection::with('condition')->paginate(20);

        return ConditionSectionResource::collection($sections);
    }

    /**
     * Display a single condition section with its parent condition.
     *
     * GET /api/v1/admin/condition-sections/{conditionSection}
     *
     * @param  ConditionSection  $conditionSection  Route-model bound section instance
     * @return ConditionSectionResource
     */
    public function show(ConditionSection $conditionSection): ConditionSectionResource
    {
        $conditionSection->load('condition');

        return new ConditionSectionResource($conditionSection);
    }

    /**
     * Create a new condition section.
     *
     * POST /api/v1/admin/condition-sections
     *
     * @param  Request  $request  Validated fields: condition_id, section_type, title, body, order_index
     * @return ConditionSectionResource The newly created section
     */
    public function store(Request $request): ConditionSectionResource
    {
        $validated = $request->validate([
            'condition_id' => 'required|exists:conditions,id',
            'section_type' => 'required|in:risk_factors,physiology,complications,solutions,additional_factors,scripture',
            'title' => 'nullable|string|max:255',
            'body' => 'required|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $section = ConditionSection::create($validated);

        return new ConditionSectionResource($section);
    }

    /**
     * Update an existing condition section.
     *
     * PUT /api/v1/admin/condition-sections/{conditionSection}
     *
     * @param  Request           $request           Validated fields: condition_id, section_type, title, body, order_index
     * @param  ConditionSection  $conditionSection  Route-model bound section instance
     * @return ConditionSectionResource The updated section
     */
    public function update(Request $request, ConditionSection $conditionSection): ConditionSectionResource
    {
        $validated = $request->validate([
            'condition_id' => 'sometimes|required|exists:conditions,id',
            'section_type' => 'sometimes|required|in:risk_factors,physiology,complications,solutions,additional_factors,scripture',
            'title' => 'nullable|string|max:255',
            'body' => 'sometimes|required|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $conditionSection->update($validated);

        return new ConditionSectionResource($conditionSection);
    }

    /**
     * Delete a condition section.
     *
     * DELETE /api/v1/admin/condition-sections/{conditionSection}
     *
     * @param  ConditionSection  $conditionSection  Route-model bound section instance
     * @return Response 204 No Content
     */
    public function destroy(ConditionSection $conditionSection): Response
    {
        $conditionSection->delete();

        return response()->noContent();
    }
}
