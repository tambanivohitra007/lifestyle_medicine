<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\Intervention;
use App\Models\Scripture;
use App\Models\Recipe;
use App\Models\EvidenceEntry;
use App\Models\Reference;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    /**
     * Global search across all entities.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2|max:255',
            'types' => 'nullable|string', // comma-separated: conditions,interventions,scriptures,recipes,evidence,references
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = $request->input('q');
        $types = $request->input('types') ? explode(',', $request->input('types')) : null;
        $limit = $request->input('limit', 10);

        $results = [];

        // Search Conditions
        if (!$types || in_array('conditions', $types)) {
            $conditions = Condition::where('name', 'like', "%{$query}%")
                ->orWhere('summary', 'like', "%{$query}%")
                ->orWhere('category', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'name', 'category', 'summary']);

            $results['conditions'] = $conditions->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'category' => $c->category,
                'summary' => $c->summary ? \Str::limit($c->summary, 150) : null,
                'type' => 'condition',
            ]);
        }

        // Search Interventions
        if (!$types || in_array('interventions', $types)) {
            $interventions = Intervention::with('careDomain')
                ->where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->orWhere('mechanism', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'name', 'description', 'care_domain_id']);

            $results['interventions'] = $interventions->map(fn($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'description' => $i->description ? \Str::limit($i->description, 150) : null,
                'care_domain' => $i->careDomain?->name,
                'type' => 'intervention',
            ]);
        }

        // Search Scriptures
        if (!$types || in_array('scriptures', $types)) {
            $scriptures = Scripture::where('reference', 'like', "%{$query}%")
                ->orWhere('text', 'like', "%{$query}%")
                ->orWhere('theme', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'reference', 'text', 'theme']);

            $results['scriptures'] = $scriptures->map(fn($s) => [
                'id' => $s->id,
                'reference' => $s->reference,
                'text' => \Str::limit($s->text, 150),
                'theme' => $s->theme,
                'type' => 'scripture',
            ]);
        }

        // Search Recipes
        if (!$types || in_array('recipes', $types)) {
            $recipes = Recipe::where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'title', 'description', 'dietary_tags']);

            $results['recipes'] = $recipes->map(fn($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'description' => $r->description ? \Str::limit($r->description, 150) : null,
                'dietary_tags' => $r->dietary_tags,
                'type' => 'recipe',
            ]);
        }

        // Search Evidence
        if (!$types || in_array('evidence', $types)) {
            $evidence = EvidenceEntry::with('intervention')
                ->where('summary', 'like', "%{$query}%")
                ->orWhere('population', 'like', "%{$query}%")
                ->orWhere('notes', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'summary', 'study_type', 'quality_rating', 'intervention_id']);

            $results['evidence'] = $evidence->map(fn($e) => [
                'id' => $e->id,
                'summary' => \Str::limit($e->summary, 150),
                'study_type' => $e->study_type,
                'quality_rating' => $e->quality_rating,
                'intervention' => $e->intervention?->name,
                'type' => 'evidence',
            ]);
        }

        // Search References
        if (!$types || in_array('references', $types)) {
            $references = Reference::where('citation', 'like', "%{$query}%")
                ->orWhere('doi', 'like', "%{$query}%")
                ->orWhere('pmid', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'citation', 'doi', 'year', 'url']);

            $results['references'] = $references->map(fn($r) => [
                'id' => $r->id,
                'citation' => \Str::limit($r->citation, 150),
                'doi' => $r->doi,
                'year' => $r->year,
                'url' => $r->url,
                'type' => 'reference',
            ]);
        }

        // Calculate total count
        $totalCount = collect($results)->flatten(1)->count();

        return response()->json([
            'query' => $query,
            'total_count' => $totalCount,
            'results' => $results,
        ]);
    }
}
