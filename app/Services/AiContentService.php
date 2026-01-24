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
            'condition_sections' => [],
            'interventions' => [],
            'evidence_entries' => [],
            'scriptures' => [],
            'egw_references' => [],
            'recipes' => [],
            'content_tags' => [],
            'errors' => [],
        ];

        DB::beginTransaction();

        try {
            // 1. Create condition
            if (isset($structured['condition'])) {
                $condition = Condition::create([
                    'name' => $structured['condition']['name'],
                    'category' => $structured['condition']['category'] ?? null,
                    'summary' => $structured['condition']['summary'] ?? null,
                ]);
                $results['condition'] = $condition->id;
            }

            if (!$results['condition']) {
                throw new \Exception('Condition is required');
            }

            // 2. Create condition sections
            if (isset($structured['condition_sections'])) {
                foreach ($structured['condition_sections'] as $index => $sectionData) {
                    $section = ConditionSection::create([
                        'condition_id' => $results['condition'],
                        'section_type' => $sectionData['section_type'],
                        'title' => $sectionData['title'] ?? null,
                        'body' => $sectionData['body'],
                        'order_index' => $sectionData['order_index'] ?? $index,
                    ]);
                    $results['condition_sections'][] = $section->id;
                }
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
            if (isset($structured['interventions'])) {
                foreach ($structured['interventions'] as $index => $intData) {
                    // Find care domain
                    $careDomain = CareDomain::where('name', $intData['care_domain'])->first();
                    if (!$careDomain) {
                        $results['errors'][] = "Care domain not found: {$intData['care_domain']}";
                        continue;
                    }

                    // Create or find intervention
                    $intervention = Intervention::firstOrCreate(
                        [
                            'care_domain_id' => $careDomain->id,
                            'name' => $intData['name'],
                        ],
                        [
                            'description' => $intData['description'] ?? null,
                            'mechanism' => $intData['mechanism'] ?? null,
                        ]
                    );

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
                        'study_type' => $evData['study_type'],
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

            // 6. Create scriptures and link to condition
            if (isset($structured['scriptures'])) {
                $condition = Condition::find($results['condition']);
                foreach ($structured['scriptures'] as $scrData) {
                    $scripture = Scripture::firstOrCreate(
                        ['reference' => $scrData['reference']],
                        [
                            'text' => $scrData['text'],
                            'theme' => $scrData['theme'] ?? null,
                        ]
                    );
                    $results['scriptures'][] = $scripture->id;

                    if (!$condition->scriptures()->where('scripture_id', $scripture->id)->exists()) {
                        $condition->scriptures()->attach($scripture->id);
                    }
                }
            }

            // 7. Create EGW references and link to condition
            if (isset($structured['egw_references'])) {
                $condition = Condition::find($results['condition']);
                foreach ($structured['egw_references'] as $egwData) {
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
                    $results['egw_references'][] = $egw->id;

                    $condition->egwReferences()->attach($egw->id);
                }
            }

            // 8. Create recipes and link to condition
            if (isset($structured['recipes']) && !empty($structured['recipes'])) {
                $condition = Condition::find($results['condition']);
                foreach ($structured['recipes'] as $recData) {
                    $recipe = Recipe::create([
                        'title' => $recData['title'],
                        'description' => $recData['description'] ?? null,
                        'dietary_tags' => $recData['dietary_tags'] ?? null,
                        'ingredients' => $recData['ingredients'] ?? null,
                        'instructions' => $recData['instructions'] ?? null,
                        'servings' => $recData['servings'] ?? null,
                        'prep_time_minutes' => $recData['prep_time_minutes'] ?? null,
                        'cook_time_minutes' => $recData['cook_time_minutes'] ?? null,
                    ]);
                    $results['recipes'][] = $recipe->id;

                    $condition->recipes()->attach($recipe->id);
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
      "dietary_tags": ["vegan", "gluten-free"],
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

Output ONLY valid JSON, no markdown formatting or explanation.
PROMPT;
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
