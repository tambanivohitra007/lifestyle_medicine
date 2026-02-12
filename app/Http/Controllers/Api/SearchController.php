<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BodySystem;
use App\Models\CareDomain;
use App\Models\Condition;
use App\Models\ConditionSection;
use App\Models\ContentTag;
use App\Models\EgwReference;
use App\Models\EvidenceEntry;
use App\Models\Intervention;
use App\Models\InterventionProtocol;
use App\Models\Recipe;
use App\Models\Reference;
use App\Models\Scripture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    protected const VALID_TYPES = [
        'conditions',
        'interventions',
        'scriptures',
        'egw_references',
        'recipes',
        'evidence',
        'references',
        'care_domains',
        'condition_sections',
        'tags',
        'protocols',
        'body_systems',
    ];

    /**
     * Global search across all entities.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2|max:255',
            'types' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = $request->input('q');
        $types = null;
        if ($request->input('types')) {
            $types = array_values(array_intersect(
                explode(',', $request->input('types')),
                self::VALID_TYPES
            ));
            if (empty($types)) {
                $types = null;
            }
        }
        $limit = $request->input('limit', 10);

        $results = [];

        // Search Conditions
        if (! $types || in_array('conditions', $types)) {
            $conditions = Condition::where('name', 'like', "%{$query}%")
                ->orWhere('summary', 'like', "%{$query}%")
                ->orWhere('category', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'name', 'category', 'summary']);

            $results['conditions'] = $conditions->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'category' => $c->category,
                'summary' => $c->summary ? \Str::limit($c->summary, 150) : null,
                'type' => 'condition',
            ]);
        }

        // Search Interventions
        if (! $types || in_array('interventions', $types)) {
            $interventions = Intervention::with('careDomain')
                ->where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->orWhere('mechanism', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'name', 'description', 'care_domain_id']);

            $results['interventions'] = $interventions->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'description' => $i->description ? \Str::limit($i->description, 150) : null,
                'care_domain' => $i->careDomain?->name,
                'type' => 'intervention',
            ]);
        }

        // Search Scriptures
        if (! $types || in_array('scriptures', $types)) {
            $scriptures = Scripture::where('reference', 'like', "%{$query}%")
                ->orWhere('text', 'like', "%{$query}%")
                ->orWhere('theme', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'reference', 'text', 'theme']);

            $results['scriptures'] = $scriptures->map(fn ($s) => [
                'id' => $s->id,
                'reference' => $s->reference,
                'text' => \Str::limit($s->text, 150),
                'theme' => $s->theme,
                'type' => 'scripture',
            ]);
        }

        // Search EGW References
        if (! $types || in_array('egw_references', $types)) {
            $egwReferences = EgwReference::where('book', 'like', "%{$query}%")
                ->orWhere('book_abbreviation', 'like', "%{$query}%")
                ->orWhere('quote', 'like', "%{$query}%")
                ->orWhere('topic', 'like', "%{$query}%")
                ->orWhere('context', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'book', 'book_abbreviation', 'page_start', 'page_end', 'paragraph', 'quote', 'topic']);

            $results['egw_references'] = $egwReferences->map(fn ($e) => [
                'id' => $e->id,
                'reference' => $e->citation,
                'text' => \Str::limit($e->quote, 150),
                'theme' => $e->topic,
                'book' => $e->book,
                'type' => 'egw_reference',
            ]);
        }

        // Search Recipes
        if (! $types || in_array('recipes', $types)) {
            $recipes = Recipe::where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'title', 'description', 'dietary_tags']);

            $results['recipes'] = $recipes->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'description' => $r->description ? \Str::limit($r->description, 150) : null,
                'dietary_tags' => $r->dietary_tags,
                'type' => 'recipe',
            ]);
        }

        // Search Evidence
        if (! $types || in_array('evidence', $types)) {
            $evidence = EvidenceEntry::with('intervention')
                ->where('summary', 'like', "%{$query}%")
                ->orWhere('population', 'like', "%{$query}%")
                ->orWhere('notes', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'summary', 'study_type', 'quality_rating', 'intervention_id']);

            $results['evidence'] = $evidence->map(fn ($e) => [
                'id' => $e->id,
                'summary' => \Str::limit($e->summary, 150),
                'study_type' => $e->study_type,
                'quality_rating' => $e->quality_rating,
                'intervention' => $e->intervention?->name,
                'type' => 'evidence',
            ]);
        }

        // Search References
        if (! $types || in_array('references', $types)) {
            $references = Reference::where('citation', 'like', "%{$query}%")
                ->orWhere('doi', 'like', "%{$query}%")
                ->orWhere('pmid', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'citation', 'doi', 'year', 'url']);

            $results['references'] = $references->map(fn ($r) => [
                'id' => $r->id,
                'citation' => \Str::limit($r->citation, 150),
                'doi' => $r->doi,
                'year' => $r->year,
                'url' => $r->url,
                'type' => 'reference',
            ]);
        }

        // Search Care Domains
        if (! $types || in_array('care_domains', $types)) {
            $careDomains = CareDomain::where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'name', 'description']);

            $results['care_domains'] = $careDomains->map(fn ($cd) => [
                'id' => $cd->id,
                'name' => $cd->name,
                'description' => $cd->description ? \Str::limit($cd->description, 150) : null,
                'type' => 'care_domain',
            ]);
        }

        // Search Condition Sections (detailed body content)
        if (! $types || in_array('condition_sections', $types)) {
            $sections = ConditionSection::with('condition:id,name')
                ->where('title', 'like', "%{$query}%")
                ->orWhere('body', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'condition_id', 'section_type', 'title', 'body']);

            $results['condition_sections'] = $sections->map(fn ($s) => [
                'id' => $s->id,
                'condition_id' => $s->condition_id,
                'condition_name' => $s->condition?->name,
                'title' => $s->title,
                'section_type' => $s->section_type,
                'summary' => \Str::limit(strip_tags($s->body), 150),
                'type' => 'condition_section',
            ]);
        }

        // Search Content Tags
        if (! $types || in_array('tags', $types)) {
            $tags = ContentTag::where('tag', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'tag']);

            $results['tags'] = $tags->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->tag,
                'type' => 'tag',
            ]);
        }

        // Search Intervention Protocols
        if (! $types || in_array('protocols', $types)) {
            $protocols = InterventionProtocol::with('intervention:id,name')
                ->where('overview', 'like', "%{$query}%")
                ->orWhere('prerequisites', 'like', "%{$query}%")
                ->orWhere('equipment_needed', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'intervention_id', 'version', 'overview', 'duration_weeks', 'intensity_level']);

            $results['protocols'] = $protocols->map(fn ($p) => [
                'id' => $p->id,
                'intervention_id' => $p->intervention_id,
                'intervention_name' => $p->intervention?->name,
                'version' => $p->version,
                'overview' => $p->overview ? \Str::limit($p->overview, 150) : null,
                'duration_weeks' => $p->duration_weeks,
                'intensity_level' => $p->intensity_level,
                'type' => 'protocol',
            ]);
        }

        // Search Body Systems
        if (! $types || in_array('body_systems', $types)) {
            $bodySystems = BodySystem::where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->limit($limit)
                ->get(['id', 'name', 'slug', 'description']);

            $results['body_systems'] = $bodySystems->map(fn ($bs) => [
                'id' => $bs->id,
                'name' => $bs->name,
                'slug' => $bs->slug,
                'description' => $bs->description ? \Str::limit($bs->description, 150) : null,
                'type' => 'body_system',
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
