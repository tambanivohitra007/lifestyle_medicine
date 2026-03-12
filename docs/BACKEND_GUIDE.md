# Backend Developer Guide

This guide explains how the Laravel backend is organized and how the major systems work.

---

## Directory Layout

```
app/
├── Actions/                # Single-responsibility operation classes
│   ├── Fortify/            # User registration & password reset
│   └── Concerns/           # Shared validation rules
├── Http/
│   ├── Controllers/
│   │   ├── Api/            # All REST API controllers (27+)
│   │   │   └── V1/         # Versioned controllers (UserController)
│   │   ├── Settings/       # User settings controllers (Inertia)
│   │   └── Traits/         # Controller traits (HasSorting)
│   ├── Middleware/          # Custom middleware (CheckRole)
│   ├── Requests/           # Form request validation classes
│   └── Resources/          # API response transformers (24)
├── Imports/                # Excel/CSV import handlers
├── Jobs/                   # Async queue jobs (3)
├── Models/                 # Eloquent models (26)
│   └── Traits/             # Shared model traits (4)
├── Providers/              # Service providers
└── Services/               # Business logic services (5)
```

---

## Models

### Primary Key Convention

**Most models use UUIDs** via the `HasUuids` trait. The one exception:

> **`User` uses auto-increment `$table->id()`**
>
> Foreign keys to `users` must use `foreignId()`, NOT `foreignUuid()`.

### Shared Traits

| Trait | What it adds | Used on |
|-------|-------------|---------|
| `HasUuids` | UUID primary keys | All models EXCEPT User |
| `HasAuditFields` | `created_by`, `updated_by`, `deleted_by` columns (foreignId to users) | Most content models |
| `HasMedia` | Polymorphic `media()` relationship | Conditions, Interventions |
| `HasPublishingStatus` | `status` column (draft/review/published/archived) + workflow methods | Conditions, Interventions, Recipes, Scriptures, EGW References |
| `HasRevisions` | Version history tracking + restore capability | Major content models |
| `SoftDeletes` | Soft deletion (`deleted_at`) | Most models |

### Core Models

| Model | Represents | Key relationships |
|-------|-----------|-------------------|
| `Condition` | A medical condition (e.g., Type 2 Diabetes) | belongsTo BodySystem, hasMany Sections, belongsToMany Interventions/Scriptures/Recipes/EgwReferences |
| `Intervention` | A lifestyle treatment (e.g., Plant-Based Diet) | belongsTo CareDomain, hasOne Protocol, hasMany Contraindications/Outcomes, belongsToMany Conditions |
| `CareDomain` | NEWSTART+ domain (Nutrition, Exercise, etc.) | hasMany Interventions |
| `BodySystem` | Medical system (Cardiovascular, Endocrine) | hasMany Conditions, hasMany ConditionCategories |
| `Scripture` | A Bible verse | belongsToMany Conditions |
| `Recipe` | A healthy recipe | belongsToMany Conditions |
| `EgwReference` | Ellen G. White health writing | belongsToMany Conditions |
| `Reference` | Academic literature reference | belongsToMany EvidenceEntries |
| `EvidenceEntry` | Scientific evidence for an intervention | belongsTo Intervention, belongsToMany References |
| `EvidenceSummary` | Summarized evidence for a condition-intervention pair | belongsTo Condition + Intervention |
| `InterventionProtocol` | Treatment protocol (duration, frequency) | belongsTo Intervention, hasMany ProtocolSteps |
| `ProtocolStep` | An ordered step in a protocol | belongsTo InterventionProtocol |
| `InterventionEffectiveness` | Effectiveness rating for condition-intervention pair | belongsTo Condition + Intervention |
| `InterventionRelationship` | Synergy/conflict between two interventions | belongsTo Intervention (x2) |
| `ContentTag` | Polymorphic tag | morphedByMany Interventions/Recipes/Scriptures/EgwReferences |
| `Media` | Polymorphic media attachment | morphTo (Condition, Intervention, etc.) |
| `ContentRevision` | Version snapshot of any content | morphTo (any content model) |
| `AiGenerationRequest` | Tracks AI draft generation | belongsTo User (requester) |
| `InfographicGenerationRequest` | Tracks infographic generation | belongsTo Condition |

---

## Controllers

### Pattern

Controllers are thin. They handle:
1. Validation (inline or via Form Requests)
2. Authorization (via middleware, not Policies)
3. Eloquent queries
4. Response formatting (via Resources)

```php
// Typical controller method
public function index(Request $request)
{
    $query = Condition::query()
        ->with(['bodySystem', 'careDomain'])
        ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
        ->when($request->category, fn($q, $c) => $q->where('category', $c));

    return ConditionResource::collection($query->paginate($request->per_page ?? 15));
}
```

### Sorting

The `HasSorting` trait (`app/Http/Controllers/Traits/HasSorting.php`) provides reusable sorting logic:
```php
$query = $this->applySorting($query, $request, ['name', 'created_at', 'updated_at']);
```

### Major Controllers

| Controller | Manages | Notable endpoints |
|-----------|---------|-------------------|
| `ConditionController` | Conditions CRUD + relationships | `complete()` returns all data in one call, `attachIntervention()`, `reorderInterventions()` |
| `InterventionController` | Interventions CRUD | `evidence()`, `conditions()` |
| `InterventionProtocolController` | Protocols + steps + contraindications + outcomes | `storeOrUpdateProtocol()`, `reorderSteps()` |
| `KnowledgeGraphController` | Graph visualization data | `fullGraph()` builds nodes + edges from all entities |
| `ConditionMindmapController` | Mindmap data + risk factors + complications | `show()` returns mindmap data structure |
| `AiContentController` | AI content generation workflow | `generateDraft()`, `structureContent()`, `importContent()` |
| `InfographicController` | Infographic generation | `generate()`, `status()` |
| `ExportController` | PDF, CSV, FHIR exports | `conditionPdf()`, `conditionFhir()`, `interventionFhir()` |
| `BibleController` | Bible API proxy | `lookup()`, `search()`, `getHealthThemes()` |
| `SearchController` | Global search | `search()` queries all entity types |
| `AnalyticsController` | Dashboard metrics | `overview()`, `growth()`, `contentCompleteness()` |

---

## Services

### GeminiService
Low-level Google Gemini API client. Handles HTTP requests to the Gemini API with retry logic and SSL configuration.

**Key methods:**
- `generateContent($prompt, $model)` — Send prompt, get text response
- Uses `draft_model` (gemini-2.0-flash) for creative generation
- Uses `structure_model` (gemini-2.5-flash) for structured/analytical tasks

### AiContentService
High-level AI orchestration. Coordinates the multi-step content generation workflow.

**Workflow:**
1. `generateDraft()` — Creates raw AI-generated text about a condition
2. `structureContent()` — Takes raw text and structures it into sections (overview, pathophysiology, solutions)
3. `importContent()` — Takes structured data and creates Condition + Sections + Relationships in the database

### BibleApiService
Integrates with the Bible.com API (api.scripture.api.bible).

**Key methods:**
- `lookup($reference)` — Look up a specific verse
- `search($query)` — Search Bible text
- `getBooks()`, `getChapter()` — Browse Bible structure
- `getHealthThemes()` — Predefined health-related scripture themes

### ImagenService
Vertex AI Imagen API client for image generation.

**Key methods:**
- `generateImage($prompt)` — Generate an image from text prompt
- Returns base64-encoded image data

### InfographicGeneratorService
Orchestrates infographic creation for conditions.

**Workflow:**
1. Builds a detailed prompt from condition data (name, sections, interventions)
2. Calls `ImagenService` to generate the image
3. Stores result as a `Media` record attached to the condition

---

## Jobs

All three jobs follow the same pattern:

```php
class GenerateAiDraftJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120;
    public $backoff = [30, 60, 120];

    public function handle(): void
    {
        // 1. Update request status to 'processing'
        // 2. Call service method
        // 3. Update request status to 'completed' with result
        // 4. On exception: update status to 'failed' with error
    }
}
```

**Queue driver:** Database (`jobs` table). Run with `php artisan queue:listen --tries=1`.

---

## Middleware

### CheckRole (`app/Http/Middleware/CheckRole.php`)
Verifies the authenticated user has one of the allowed roles.

**Usage in routes:**
```php
Route::middleware('role:admin,editor')  // allows admin or editor
Route::middleware('role:admin')         // admin only
```

### Route Middleware Stack

```
Public API:    throttle:api (60/min)
Auth required: auth:sanctum
Editor+Admin:  auth:sanctum → role:admin,editor
Admin only:    auth:sanctum → role:admin
AI endpoints:  auth:sanctum → role:admin → throttle:ai (10/min)
```

---

## Resources (API Response Transformers)

Every model has a corresponding Resource class in `app/Http/Resources/`. Resources control what data is included in API responses:

```php
class ConditionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'body_system' => new BodySystemResource($this->whenLoaded('bodySystem')),
            'interventions_count' => $this->whenCounted('interventions'),
            // ... controlled field exposure
        ];
    }
}
```

**Key pattern:** Use `$this->whenLoaded()` for relationships and `$this->whenCounted()` for counts — this prevents N+1 queries and only includes data when explicitly loaded by the controller.

---

## Imports

### ConditionsImport / InterventionsImport
Excel/CSV import handlers using Laravel Excel (Maatwebsite).

**Upload flow:**
1. Admin uploads file via `POST /admin/import/conditions`
2. `ImportController` validates file format
3. Import class reads rows and creates/updates models
4. Returns summary of imported/skipped/failed rows

---

## Testing

- **Framework:** PHPUnit
- **Database:** SQLite in-memory (fast, isolated)
- **Queue:** `sync` driver (jobs run immediately in tests)
- **Config:** `phpunit.xml`

```bash
php artisan test                        # All tests
php artisan test --filter=ClassName     # Single class
./vendor/bin/phpunit                    # Alternative
```

**Caveat:** MySQL-specific syntax must be guarded:
```php
if (DB::getDriverName() === 'mysql') {
    // MySQL-only migration code
}
```
