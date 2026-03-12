<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CareDomainResource;
use App\Models\CareDomain;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * Manages NEWSTART+ care domains (e.g., Nutrition, Exercise, Water, etc.).
 *
 * Care domains categorize interventions by health principle. Each intervention
 * belongs to one care domain. Supports ordering via order_index.
 *
 * Routes: /api/v1/care-domains (public read), /api/v1/admin/care-domains (admin CRUD)
 */
class CareDomainController extends Controller
{
    /**
     * List all care domains with their interventions, ordered by order_index then name.
     *
     * GET /api/v1/care-domains
     *
     * @return AnonymousResourceCollection Paginated collection of CareDomainResource (50 per page)
     */
    public function index(): AnonymousResourceCollection
    {
        $careDomains = CareDomain::with('interventions')
            ->orderBy('order_index')
            ->orderBy('name')
            ->paginate(50);

        return CareDomainResource::collection($careDomains);
    }

    /**
     * Display a single care domain with its interventions and audit info.
     *
     * GET /api/v1/care-domains/{careDomain}
     *
     * @param  CareDomain  $careDomain  Route-model bound care domain instance
     * @return CareDomainResource
     */
    public function show(CareDomain $careDomain): CareDomainResource
    {
        $careDomain->load(['interventions', 'creator', 'updater']);

        return new CareDomainResource($careDomain);
    }

    /**
     * Create a new care domain.
     *
     * POST /api/v1/admin/care-domains
     *
     * @param  Request  $request  Validated fields: name (unique), description, icon, order_index
     * @return CareDomainResource The newly created care domain
     */
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

    /**
     * Update an existing care domain.
     *
     * PUT /api/v1/admin/care-domains/{careDomain}
     *
     * @param  Request     $request     Validated fields: name (unique), description, icon, order_index
     * @param  CareDomain  $careDomain  Route-model bound care domain instance
     * @return CareDomainResource The updated care domain
     */
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

    /**
     * Soft-delete a care domain.
     *
     * DELETE /api/v1/admin/care-domains/{careDomain}
     *
     * @param  CareDomain  $careDomain  Route-model bound care domain instance
     * @return Response 204 No Content
     */
    public function destroy(CareDomain $careDomain): Response
    {
        $careDomain->delete();

        return response()->noContent();
    }
}
