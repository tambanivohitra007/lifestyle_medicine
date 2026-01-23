<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConditionSectionResource;
use App\Models\ConditionSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ConditionSectionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $sections = ConditionSection::with('condition')->paginate(20);

        return ConditionSectionResource::collection($sections);
    }

    public function show(ConditionSection $conditionSection): ConditionSectionResource
    {
        $conditionSection->load('condition');

        return new ConditionSectionResource($conditionSection);
    }

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

    public function destroy(ConditionSection $conditionSection): Response
    {
        $conditionSection->delete();

        return response()->noContent();
    }
}
