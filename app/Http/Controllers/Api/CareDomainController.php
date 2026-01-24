<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CareDomainResource;
use App\Models\CareDomain;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class CareDomainController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $careDomains = CareDomain::with('interventions')
            ->orderBy('order_index')
            ->orderBy('name')
            ->paginate(50);

        return CareDomainResource::collection($careDomains);
    }

    public function show(CareDomain $careDomain): CareDomainResource
    {
        $careDomain->load(['interventions', 'creator', 'updater']);

        return new CareDomainResource($careDomain);
    }

    public function store(Request $request): CareDomainResource
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('care_domains', 'name')->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $careDomain = CareDomain::create($validated);

        return new CareDomainResource($careDomain);
    }

    public function update(Request $request, CareDomain $careDomain): CareDomainResource
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('care_domains', 'name')->ignore($careDomain->id)->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $careDomain->update($validated);

        return new CareDomainResource($careDomain);
    }

    public function destroy(CareDomain $careDomain): Response
    {
        $careDomain->delete();

        return response()->noContent();
    }
}
