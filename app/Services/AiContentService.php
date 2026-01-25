<?php

namespace App\Services;

use App\Models\CareDomain;
use App\Models\Condition;
use App\Models\ConditionSection;
use App\Models\ContentTag;
use App\Models\EgwReference;
use App\Models\EvidenceEntry;
use App\Models\Intervention;
use App\Models\Recipe;
use App\Models\Reference;
use App\Models\Scripture;
use GeminiAPI\Client;
use GeminiAPI\Resources\Parts\TextPart;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AiContentService
{
    protected ?Client $client = null;
    protected ?string $apiKey = null;

    /**
     * Valid study types for evidence entries (must match database enum).
     */
    protected const VALID_STUDY_TYPES = [
        'rct',
        'meta_analysis',
        'systematic_review',
        'observational',
        'case_series',
        'expert_opinion',
    ];

    /**
     * Mapping of common AI-generated study type variations to valid values.
     */
    protected const STUDY_TYPE_ALIASES = [
        'randomized controlled trial' => 'rct',
        'randomised controlled trial' => 'rct',
        'randomized_controlled_trial' => 'rct',
        'clinical trial' => 'rct',
        'clinical_trial' => 'rct',
        'meta-analysis' => 'meta_analysis',
        'metaanalysis' => 'meta_analysis',
        'systematic review' => 'systematic_review',
        'systematic-review' => 'systematic_review',
        'review' => 'systematic_review',
        'longitudinal' => 'observational',
        'longitudinal study' => 'observational',
        'cohort' => 'observational',
        'cohort study' => 'observational',
        'cohort_study' => 'observational',
        'cross-sectional' => 'observational',
        'cross_sectional' => 'observational',
        'prospective' => 'observational',
        'retrospective' => 'observational',
        'epidemiological' => 'observational',
        'case study' => 'case_series',
        'case_study' => 'case_series',
        'case report' => 'case_series',
        'case-series' => 'case_series',
        'expert opinion' => 'expert_opinion',
        'expert-opinion' => 'expert_opinion',
        'consensus' => 'expert_opinion',
        'guideline' => 'expert_opinion',
        'guidelines' => 'expert_opinion',
    ];

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');

        if ($this->apiKey) {
            $guzzleOptions = [
                'timeout' => 120, // 2 minute timeout for AI requests
                'connect_timeout' => 30,
            ];

            // Disable SSL verification on Windows local environment
            if (config('app.env') === 'local' && strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $guzzleOptions['verify'] = false;
            }

            $httpClient = new GuzzleClient($guzzleOptions);
            $this->client = new Client($this->apiKey, $httpClient);
        }
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== null && $this->apiKey !== '';
    }

    /**
     * Generate a human-readable draft for a condition.
     */
    public function generateDraft(string $conditionName, string $context = ''): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Gemini API is not configured. Please add GEMINI_API_KEY to your .env file.'];
        }

        $prompt = $this->buildDraftPrompt($conditionName, $context);

        try {
            $response = $this->client->generativeModel('gemini-2.0-flash')->generateContent(
                new TextPart($prompt)
            );

            return [
                'success' => true,
                'condition_name' => $conditionName,
                'draft' => $response->text(),
            ];
        } catch (\Exception $e) {
            Log::error('AI Content draft generation error: ' . $e->getMessage());
            return ['error' => 'Failed to generate draft. Please try again.'];
        }
    }

    /**
     * Convert approved draft into structured JSON.
     */
    public function structureContent(string $conditionName, string $approvedDraft): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Gemini API is not configured.'];
        }

        $careDomains = CareDomain::pluck('name')->toArray();
        $prompt = $this->buildStructurePrompt($conditionName, $approvedDraft, $careDomains);

        try {
            $response = $this->client->generativeModel('gemini-2.0-flash')->generateContent(
                new TextPart($prompt)
            );

            $text = $response->text();
            $structured = $this->parseJsonResponse($text);

            if (isset($structured['error'])) {
                return $structured;
            }

            return [
                'success' => true,
                'structured' => $structured,
            ];
        } catch (\Exception $e) {
            Log::error('AI Content structure error: ' . $e->getMessage());
            return ['error' => 'Failed to structure content. Please try again.'];
        }
    }

    /**
     * Import structured content into the database.
     */
    public function importContent(array $structured): array
    {
        $results = [
            'condition' => null,
            'condition_existed' => false,
            'condition_sections' => [],
            'interventions' => [],
            'interventions_reused' => 0,
            'evidence_entries' => [],
            'scriptures' => [],
            'scriptures_reused' => 0,
            'egw_references' => [],
            'egw_references_reused' => 0,
            'recipes' => [],
            'recipes_reused' => 0,
            'content_tags' => [],
            'errors' => [],
        ];

        // Log the incoming structured data for debugging
        Log::info('AI Content Import - Incoming data keys: ' . implode(', ', array_keys($structured)));
        Log::info('AI Content Import - Sections count: ' . count($structured['condition_sections'] ?? []));
        Log::info('AI Content Import - Interventions count: ' . count($structured['interventions'] ?? []));

        DB::beginTransaction();

        try {
            // 1. Create or find condition (case-insensitive match by name)
            if (isset($structured['condition'])) {
                $conditionName = $structured['condition']['name'];
                $existingCondition = Condition::whereRaw('LOWER(name) = ?', [strtolower($conditionName)])->first();

                if ($existingCondition) {
                    // Update existing condition with new data
                    $existingCondition->update([
                        'category' => $structured['condition']['category'] ?? $existingCondition->category,
                        'summary' => $structured['condition']['summary'] ?? $existingCondition->summary,
                    ]);
                    $condition = $existingCondition;
                    $results['condition'] = $condition->id;
                    $results['condition_existed'] = true;
                    Log::info('AI Content Import - Using existing condition: ' . $condition->id);
                } else {
                    $condition = Condition::create([
                        'name' => $conditionName,
                        'category' => $structured['condition']['category'] ?? null,
                        'summary' => $structured['condition']['summary'] ?? null,
                    ]);
                    $results['condition'] = $condition->id;
                    $results['condition_existed'] = false;
                    Log::info('AI Content Import - Condition created: ' . $condition->id);
                }
            }

            if (!$results['condition']) {
                throw new \Exception('Condition is required');
            }

            // 2. Create condition sections
            if (isset($structured['condition_sections']) && is_array($structured['condition_sections'])) {
                Log::info('AI Content Import - Processing ' . count($structured['condition_sections']) . ' sections');
                foreach ($structured['condition_sections'] as $index => $sectionData) {
                    try {
                        $section = ConditionSection::create([
                            'condition_id' => $results['condition'],
                            'section_type' => $sectionData['section_type'],
                            'title' => $sectionData['title'] ?? null,
                            'body' => $sectionData['body'],
                            'order_index' => $sectionData['order_index'] ?? $index,
                        ]);
                        $results['condition_sections'][] = $section->id;
                        Log::info('AI Content Import - Section created: ' . $section->section_type);
                    } catch (\Exception $e) {
                        Log::error('AI Content Import - Section error: ' . $e->getMessage());
                        $results['errors'][] = "Section error: {$e->getMessage()}";
                    }
                }
            } else {
                Log::warning('AI Content Import - No condition_sections found in structured data');
            }

            // 3. Create/link content tags
            if (isset($structured['content_tags'])) {
                foreach ($structured['content_tags'] as $tagName) {
                    $tag = ContentTag::firstOrCreate(['tag' => strtolower($tagName)]);
                    $results['content_tags'][] = $tag->id;
                }
            }

            // 4. Create interventions and link to condition
            $interventionMap = []; // name => id mapping
            if (isset($structured['interventions']) && is_array($structured['interventions'])) {
                Log::info('AI Content Import - Processing ' . count($structured['interventions']) . ' interventions');
                foreach ($structured['interventions'] as $index => $intData) {
                    // Find care domain
                    $careDomain = CareDomain::where('name', $intData['care_domain'])->first();
                    if (!$careDomain) {
                        Log::warning('AI Content Import - Care domain not found: ' . ($intData['care_domain'] ?? 'unknown'));
                        $results['errors'][] = "Care domain not found: {$intData['care_domain']}";
                        continue;
                    }

                    // Create or find intervention
                    $existingIntervention = Intervention::where('care_domain_id', $careDomain->id)
                        ->whereRaw('LOWER(name) = ?', [strtolower($intData['name'])])
                        ->first();

                    if ($existingIntervention) {
                        $intervention = $existingIntervention;
                        $results['interventions_reused']++;
                        Log::info('AI Content Import - Using existing intervention: ' . $intervention->name);
                    } else {
                        $intervention = Intervention::create([
                            'care_domain_id' => $careDomain->id,
                            'name' => $intData['name'],
                            'description' => $intData['description'] ?? null,
                            'mechanism' => $intData['mechanism'] ?? null,
                        ]);
                        Log::info('AI Content Import - Intervention created: ' . $intervention->name);
                    }

                    $interventionMap[$intData['name']] = $intervention->id;
                    $results['interventions'][] = $intervention->id;

                    // Link to condition with pivot data
                    $pivot = $intData['pivot'] ?? [];
                    $condition = Condition::find($results['condition']);

                    // Check if already attached
                    if (!$condition->interventions()->where('intervention_id', $intervention->id)->exists()) {
                        $condition->interventions()->attach($intervention->id, [
                            'strength_of_evidence' => $pivot['strength_of_evidence'] ?? 'emerging',
                            'recommendation_level' => $pivot['recommendation_level'] ?? 'optional',
                            'clinical_notes' => $pivot['clinical_notes'] ?? null,
                            'order_index' => $pivot['order_index'] ?? $index,
                        ]);
                    }
                }
            }

            // 5. Create evidence entries with references
            if (isset($structured['evidence_entries'])) {
                foreach ($structured['evidence_entries'] as $evData) {
                    $interventionId = $interventionMap[$evData['intervention_name']] ?? null;
                    if (!$interventionId) {
                        $results['errors'][] = "Intervention not found for evidence: {$evData['intervention_name']}";
                        continue;
                    }

                    $evidence = EvidenceEntry::create([
                        'intervention_id' => $interventionId,
                        'study_type' => $this->normalizeStudyType($evData['study_type'] ?? 'observational'),
                        'population' => $evData['population'] ?? null,
                        'quality_rating' => $evData['quality_rating'] ?? null,
                        'summary' => $evData['summary'],
                        'notes' => $evData['notes'] ?? null,
                    ]);
                    $results['evidence_entries'][] = $evidence->id;

                    // Create and link references
                    if (isset($evData['references'])) {
                        foreach ($evData['references'] as $refData) {
                            $reference = Reference::firstOrCreate(
                                ['citation' => $refData['citation']],
                                [
                                    'doi' => $refData['doi'] ?? null,
                                    'pmid' => $refData['pmid'] ?? null,
                                    'url' => $refData['url'] ?? null,
                                    'year' => $refData['year'] ?? null,
                                ]
                            );
                            $evidence->references()->syncWithoutDetaching([$reference->id]);
                        }
                    }
                }
            }

            // 6. Create or find scriptures and link to condition
            // Match by reference (case-insensitive)
            if (isset($structured['scriptures'])) {
                $condition = Condition::find($results['condition']);
                foreach ($structured['scriptures'] as $scrData) {
                    // Try to find existing scripture by reference (case-insensitive)
                    $existingScripture = Scripture::whereRaw('LOWER(reference) = ?', [strtolower($scrData['reference'])])->first();

                    if ($existingScripture) {
                        $scripture = $existingScripture;
                        $results['scriptures_reused']++;
                        Log::info('AI Content Import - Using existing scripture: ' . $scripture->reference);
                    } else {
                        $scripture = Scripture::create([
                            'reference' => $scrData['reference'],
                            'text' => $scrData['text'],
                            'theme' => $scrData['theme'] ?? null,
                        ]);
                        Log::info('AI Content Import - Scripture created: ' . $scripture->reference);
                    }

                    $results['scriptures'][] = $scripture->id;

                    if (!$condition->scriptures()->where('scripture_id', $scripture->id)->exists()) {
                        $condition->scriptures()->attach($scripture->id);
                    }
                }
            }

            // 7. Create or find EGW references and link to condition
            // Match by book + page_start + first 100 chars of quote (case-insensitive)
            if (isset($structured['egw_references'])) {
                $condition = Condition::find($results['condition']);
                foreach ($structured['egw_references'] as $egwData) {
                    $quotePrefix = substr($egwData['quote'] ?? '', 0, 100);

                    // Try to find existing EGW reference
                    $existingEgw = EgwReference::whereRaw('LOWER(book) = ?', [strtolower($egwData['book'])])
                        ->where(function ($query) use ($egwData, $quotePrefix) {
                            // Match by page if available, otherwise by quote prefix
                            if (!empty($egwData['page_start'])) {
                                $query->where('page_start', $egwData['page_start']);
                            } else {
                                $query->whereRaw('LOWER(SUBSTRING(quote, 1, 100)) = ?', [strtolower($quotePrefix)]);
                            }
                        })
                        ->first();

                    if ($existingEgw) {
                        $egw = $existingEgw;
                        $results['egw_references_reused']++;
                        Log::info('AI Content Import - Using existing EGW reference: ' . $egw->id);
                    } else {
                        $egw = EgwReference::create([
                            'book' => $egwData['book'],
                            'book_abbreviation' => $egwData['book_abbreviation'] ?? null,
                            'chapter' => $egwData['chapter'] ?? null,
                            'page_start' => $egwData['page_start'] ?? null,
                            'page_end' => $egwData['page_end'] ?? null,
                            'paragraph' => $egwData['paragraph'] ?? null,
                            'quote' => $egwData['quote'],
                            'topic' => $egwData['topic'] ?? null,
                            'context' => $egwData['context'] ?? null,
                        ]);
                        Log::info('AI Content Import - EGW reference created: ' . $egw->id);
                    }

                    $results['egw_references'][] = $egw->id;

                    // Only attach if not already linked
                    if (!$condition->egwReferences()->where('egw_reference_id', $egw->id)->exists()) {
                        $condition->egwReferences()->attach($egw->id);
                    }
                }
            }

            // 8. Create or find recipes and link to condition
            // All AI-generated recipes must be vegetarian
            // Match by title (case-insensitive)
            if (isset($structured['recipes']) && !empty($structured['recipes'])) {
                $condition = Condition::find($results['condition']);
                foreach ($structured['recipes'] as $recData) {
                    // Ensure vegetarian tag is present
                    $dietaryTags = $recData['dietary_tags'] ?? [];
                    if (is_array($dietaryTags) && !in_array('vegetarian', array_map('strtolower', $dietaryTags))) {
                        $dietaryTags[] = 'vegetarian';
                    }

                    // Try to find existing recipe by title (case-insensitive)
                    $existingRecipe = Recipe::whereRaw('LOWER(title) = ?', [strtolower($recData['title'])])->first();

                    if ($existingRecipe) {
                        $recipe = $existingRecipe;
                        $results['recipes_reused']++;
                        // Merge dietary tags if the existing recipe doesn't have vegetarian
                        $existingTags = $existingRecipe->dietary_tags ?? [];
                        if (is_array($existingTags) && !in_array('vegetarian', array_map('strtolower', $existingTags))) {
                            $existingTags[] = 'vegetarian';
                            $existingRecipe->update(['dietary_tags' => $existingTags]);
                        }
                        Log::info('AI Content Import - Using existing recipe: ' . $recipe->id);
                    } else {
                        $recipe = Recipe::create([
                            'title' => $recData['title'],
                            'description' => $recData['description'] ?? null,
                            'dietary_tags' => $dietaryTags,
                            'ingredients' => $recData['ingredients'] ?? null,
                            'instructions' => $recData['instructions'] ?? null,
                            'servings' => $recData['servings'] ?? null,
                            'prep_time_minutes' => $recData['prep_time_minutes'] ?? null,
                            'cook_time_minutes' => $recData['cook_time_minutes'] ?? null,
                        ]);
                        Log::info('AI Content Import - Recipe created: ' . $recipe->id);
                    }

                    $results['recipes'][] = $recipe->id;

                    // Only attach if not already linked
                    if (!$condition->recipes()->where('recipe_id', $recipe->id)->exists()) {
                        $condition->recipes()->attach($recipe->id);
                    }
                }
            }

            DB::commit();

            return [
                'success' => true,
                'results' => $results,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('AI Content import error: ' . $e->getMessage());
            return [
                'error' => 'Failed to import content: ' . $e->getMessage(),
                'results' => $results,
            ];
        }
    }

    /**
     * Build the prompt for draft generation.
     */
    protected function buildDraftPrompt(string $conditionName, string $context): string
    {
        $contextText = $context ? "\n\nAdditional context provided by user: {$context}" : '';

        return <<<PROMPT
You are a clinical knowledge expert for a Lifestyle Medicine & Gospel Medical Evangelism platform.

Generate a comprehensive, human-readable draft about the health condition: **{$conditionName}**{$contextText}

Structure your response with these sections:

## 1. Overview
Brief description of the condition and its significance.

## 2. Risk Factors
- List major risk factors
- Include modifiable and non-modifiable factors

## 3. Physiology & Pathophysiology
- Explain the underlying mechanisms
- How the condition develops and progresses

## 4. Complications
- Potential health consequences if untreated
- Related conditions

## 5. Lifestyle Interventions
For each intervention, include:
- Name and description
- Which care domain it belongs to (Nutrition, Exercise, Rest, Stress Management, etc.)
- Mechanism of action
- Evidence strength (high/moderate/emerging)
- Whether it's a core, adjunct, or optional recommendation

Organize interventions by care domain:
- **Nutrition**: Diet modifications, specific foods
- **Exercise**: Physical activity recommendations
- **Rest**: Sleep and recovery
- **Stress Management**: Mental health approaches
- **Hydrotherapy/Water Therapy**: Water-based treatments
- **Sunlight**: Light exposure benefits
- **Temperance**: Moderation principles
- **Spiritual Care**: Faith-based support

## 6. Evidence Summary
- Cite relevant research (include study type, findings)
- Note quality of evidence

## 7. Scripture & Spiritual Care
- Relevant Bible verses that provide hope or guidance
- Include the full verse text and theme

## 8. Ellen G. White References
- Relevant quotes from EGW health writings
- Include book name, page numbers if known
- Focus on: Ministry of Healing, Counsels on Diet and Foods, Counsels on Health

## 9. Suggested Recipes (if applicable)
- Therapeutic food recommendations specific to this condition
- **IMPORTANT: All recipes MUST be VEGETARIAN (no meat, no fish, no poultry)**
- Prefer plant-based, whole food ingredients
- Include vegan options when possible

## 10. Content Tags
- List relevant tags for categorization (lowercase, e.g., cardiovascular, lifestyle_medicine)

---

**IMPORTANT:**
- This is a DRAFT for human review
- Use evidence-based information
- Include both conventional and lifestyle medicine approaches
- Be respectful of spiritual content
- Do NOT output JSON - this is for human reading

Label clearly at the top:
> **DRAFT — NOT YET STRUCTURED OR SAVED**
PROMPT;
    }

    /**
     * Build the prompt for structuring approved content.
     */
    protected function buildStructurePrompt(string $conditionName, string $draft, array $careDomains): string
    {
        $domainsJson = json_encode($careDomains);

        return <<<PROMPT
You are converting approved health content into a structured JSON format for database import.

**Condition:** {$conditionName}

**Approved Draft Content:**
{$draft}

**Available Care Domains (use exact names):**
{$domainsJson}

Convert the above content into this exact JSON structure:

```json
{
  "condition": {
    "name": "string (required)",
    "category": "string (e.g., Cardiovascular, Metabolic, Mental Health)",
    "summary": "string (2-3 sentence overview)"
  },
  "condition_sections": [
    {
      "section_type": "risk_factors | physiology | complications | solutions | additional_factors | scripture",
      "title": "string",
      "body": "string (HTML allowed: <p>, <ul>, <li>, <strong>, <em>)",
      "order_index": 0
    }
  ],
  "interventions": [
    {
      "care_domain": "string (must match exactly from available domains)",
      "name": "string (specific, actionable)",
      "description": "string (HTML allowed)",
      "mechanism": "string (how it works)",
      "pivot": {
        "strength_of_evidence": "high | moderate | emerging | insufficient",
        "recommendation_level": "core | adjunct | optional",
        "clinical_notes": "string",
        "order_index": 0
      }
    }
  ],
  "evidence_entries": [
    {
      "intervention_name": "string (must match an intervention name above)",
      "study_type": "rct | meta_analysis | systematic_review | observational | case_series | expert_opinion",
      "population": "string (e.g., Adults with hypertension)",
      "quality_rating": "A | B | C | D",
      "summary": "string (key findings)",
      "notes": "string (optional additional context)",
      "references": [
        {
          "citation": "string (full citation in academic format)",
          "doi": "string (optional)",
          "pmid": "string (optional)",
          "url": "string (optional)",
          "year": 2024
        }
      ]
    }
  ],
  "scriptures": [
    {
      "reference": "string (e.g., 3 John 1:2)",
      "text": "string (full verse text)",
      "theme": "string (e.g., Divine Health, Trust, Peace)"
    }
  ],
  "egw_references": [
    {
      "book": "string (full book name)",
      "book_abbreviation": "string (e.g., MH, CD, CH)",
      "chapter": "string (optional)",
      "page_start": 127,
      "page_end": null,
      "paragraph": "string (optional)",
      "quote": "string (the actual quote)",
      "topic": "string (e.g., Natural Remedies, Diet)",
      "context": "string (optional application note)"
    }
  ],
  "recipes": [
    {
      "title": "string",
      "description": "string",
      "dietary_tags": ["vegetarian", "vegan", "gluten-free"],
      "ingredients": [{"item": "string", "amount": "string"}],
      "instructions": "string",
      "servings": 4,
      "prep_time_minutes": 15,
      "cook_time_minutes": 30
    }
  ],
  "content_tags": ["tag1", "tag2"]
}
```

**Rules:**
1. Use ONLY care domains from the provided list
2. Every intervention must link to exactly one care domain
3. Evidence entries must reference intervention names exactly
4. Section types must be one of: risk_factors, physiology, complications, solutions, additional_factors, scripture
5. Quality ratings: A (high), B (moderate), C (low), D (very low)
6. If no recipes are applicable, use empty array: "recipes": []
7. All tags should be lowercase with underscores
8. **ALL RECIPES MUST BE VEGETARIAN** - No meat, fish, or poultry. Include "vegetarian" in dietary_tags. Prefer plant-based, whole food ingredients.
9. **STUDY TYPES MUST BE EXACT**: Use ONLY these exact values for study_type: "rct", "meta_analysis", "systematic_review", "observational", "case_series", "expert_opinion". Do NOT use variations like "longitudinal", "cohort", "cross-sectional" - use "observational" for these.

Output ONLY valid JSON, no markdown formatting or explanation.
PROMPT;
    }

    /**
     * Normalize a study type value to a valid enum value.
     * Maps common variations and aliases to the correct database enum values.
     */
    protected function normalizeStudyType(string $studyType): string
    {
        $normalized = strtolower(trim($studyType));

        // Check if already valid
        if (in_array($normalized, self::VALID_STUDY_TYPES)) {
            return $normalized;
        }

        // Check aliases
        if (isset(self::STUDY_TYPE_ALIASES[$normalized])) {
            Log::info("AI Content Import - Mapped study type '{$studyType}' to '" . self::STUDY_TYPE_ALIASES[$normalized] . "'");
            return self::STUDY_TYPE_ALIASES[$normalized];
        }

        // Try partial matching for common patterns
        if (str_contains($normalized, 'rct') || str_contains($normalized, 'randomized') || str_contains($normalized, 'randomised')) {
            Log::info("AI Content Import - Mapped study type '{$studyType}' to 'rct' (pattern match)");
            return 'rct';
        }
        if (str_contains($normalized, 'meta') || str_contains($normalized, 'analysis')) {
            Log::info("AI Content Import - Mapped study type '{$studyType}' to 'meta_analysis' (pattern match)");
            return 'meta_analysis';
        }
        if (str_contains($normalized, 'systematic') || str_contains($normalized, 'review')) {
            Log::info("AI Content Import - Mapped study type '{$studyType}' to 'systematic_review' (pattern match)");
            return 'systematic_review';
        }
        if (str_contains($normalized, 'cohort') || str_contains($normalized, 'longitudinal') || str_contains($normalized, 'observ') || str_contains($normalized, 'cross')) {
            Log::info("AI Content Import - Mapped study type '{$studyType}' to 'observational' (pattern match)");
            return 'observational';
        }
        if (str_contains($normalized, 'case')) {
            Log::info("AI Content Import - Mapped study type '{$studyType}' to 'case_series' (pattern match)");
            return 'case_series';
        }

        // Default fallback
        Log::warning("AI Content Import - Unknown study type '{$studyType}', defaulting to 'observational'");
        return 'observational';
    }

    /**
     * Parse JSON from AI response.
     */
    protected function parseJsonResponse(string $text): array
    {
        // Remove markdown code blocks if present
        $text = preg_replace('/```json\s*/', '', $text);
        $text = preg_replace('/```\s*/', '', $text);
        $text = trim($text);

        $decoded = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('Failed to parse AI JSON response: ' . json_last_error_msg());
            Log::debug('Raw response: ' . substr($text, 0, 500));
            return ['error' => 'Failed to parse structured content. The AI response was not valid JSON.'];
        }

        return $decoded;
    }
}
