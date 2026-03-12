# Architecture Overview

This document explains how the Lifestyle Medicine Knowledge Platform is structured, how data flows through the system, and how the major components interact.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                     │
│                                                                     │
│  ┌──────────────────┐     ┌──────────────────────────────────────┐  │
│  │  Inertia App      │     │  Admin Dashboard (SPA)              │  │
│  │  resources/js/    │     │  admin-dashboard/src/               │  │
│  │  React 19 + TS    │     │  React 19 + JSX                    │  │
│  │  SSR via Inertia  │     │  React Router 7 + Axios            │  │
│  │  Tailwind CSS 4   │     │  Tailwind CSS 3                    │  │
│  │  Port: 8000 (same │     │  Port: 5173 (dev) / static (prod)  │  │
│  │  as Laravel)      │     │                                    │  │
│  └────────┬─────────┘     └────────────┬───────────────────────┘  │
│           │                             │                          │
│     Inertia Protocol              REST API (Axios)                │
│     (same-origin)                 /api/v1/*                       │
└───────────┼─────────────────────────────┼──────────────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LARAVEL BACKEND                                   │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Middleware   │  │  Controllers │  │  Routes                    │ │
│  │  - Sanctum   │  │  - Api/      │  │  - routes/api.php          │ │
│  │  - CheckRole │  │  - Settings/ │  │  - routes/web.php          │ │
│  │  - Throttle  │  │              │  │  - routes/settings.php     │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────────────────────┘ │
│         │                │                                          │
│         ▼                ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    SERVICE LAYER                              │   │
│  │  AiContentService  │ GeminiService  │ BibleApiService        │   │
│  │  ImagenService     │ InfographicGeneratorService              │   │
│  └──────────┬──────────────────────────────┬────────────────────┘   │
│             │                              │                        │
│             ▼                              ▼                        │
│  ┌────────────────────┐     ┌───────────────────────────────────┐   │
│  │  QUEUE (Jobs)       │     │  EXTERNAL APIs                    │   │
│  │  Database driver    │     │  - Google Gemini (AI drafts)      │   │
│  │  - GenerateAiDraft  │     │  - Vertex AI Imagen (images)      │   │
│  │  - StructureContent │     │  - Bible.com API (scriptures)     │   │
│  │  - GenInfographic   │     └───────────────────────────────────┘   │
│  └────────┬───────────┘                                             │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   DATA LAYER                                  │   │
│  │  Eloquent Models (UUID PKs) → MySQL (prod) / SQLite (test)   │   │
│  │  Traits: HasUuids, HasAuditFields, HasMedia,                 │   │
│  │          HasPublishingStatus, HasRevisions, SoftDeletes       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Two Frontend Apps

This project has **two completely separate frontend applications**. Understanding this is key.

### 1. Inertia App (`resources/js/`)

- **Purpose**: Public-facing website and user authentication (login, register, profile, 2FA)
- **Tech**: React 19 + TypeScript, Inertia.js SSR, Tailwind CSS 4, Radix UI
- **How it works**: Inertia.js sends JSON responses from Laravel controllers that render React components server-side. There are no API calls — the frontend receives data as page props directly from PHP controllers.
- **Routing**: Wayfinder generates type-safe route helpers from Laravel routes
- **Build**: Runs on the same origin as Laravel (port 8000)

### 2. Admin Dashboard (`admin-dashboard/`)

- **Purpose**: Content management interface for admins and editors
- **Tech**: React 19 + JSX (no TypeScript), React Router 7, Tailwind CSS 3, Axios
- **How it works**: A standalone SPA that communicates with the Laravel backend via REST API calls to `/api/v1/`. Completely decoupled from Laravel.
- **Routing**: React Router 7 handles client-side routing
- **Auth**: Sanctum bearer token stored in AuthContext with 30-minute inactivity timeout
- **Build**: Separate Vite build, deployed as static files to a different subdomain

### Why two apps?

The Inertia app handles the public-facing experience with SSR for SEO. The admin dashboard is a separate SPA because content editors need a rich, interactive experience (drag-and-drop, knowledge graphs, real-time AI generation) that benefits from full client-side control.

---

## Data Flow

### Content Creation Flow

```
Editor opens Admin Dashboard
    → Fills in condition form (ConditionForm.jsx)
    → POST /api/v1/admin/conditions (Axios via lib/api.js)
    → AuthController middleware validates Sanctum token
    → CheckRole middleware verifies admin/editor role
    → ConditionController@store validates & creates
    → Condition model (HasUuids, HasAuditFields) saves to DB
    → ConditionResource transforms response
    → JSON response returned to SPA
```

### AI Content Generation Flow

```
Admin clicks "Generate AI Draft"
    → POST /api/v1/admin/ai/generate-draft
    → AiContentController dispatches GenerateAiDraftJob to queue
    → Returns job ID immediately (async)

Queue worker picks up job:
    → GenerateAiDraftJob::handle()
    → Calls AiContentService::generateDraft()
    → AiContentService calls GeminiService::generateContent()
    → GeminiService makes HTTP request to Google Gemini API
    → Raw AI text stored in AiGenerationRequest model
    → Job status updated (pending → completed/failed)

Admin polls for status:
    → GET /api/v1/admin/ai/requests/{id}/status
    → Returns current status + generated content when ready

Admin reviews & imports:
    → POST /api/v1/admin/ai/structure-content (dispatches StructureAiContentJob)
    → Gemini "System 2" model structures raw draft into sections
    → POST /api/v1/admin/ai/import-content
    → Creates condition + sections + relationships from structured data
```

### Infographic Generation Flow

```
Admin triggers infographic generation:
    → POST /api/v1/admin/conditions/{id}/infographics/generate
    → Dispatches GenerateInfographicJob to queue
    → InfographicGeneratorService orchestrates the process
    → ImagenService calls Vertex AI Imagen API
    → Generated image stored via Media model (polymorphic)
    → InfographicGenerationRequest tracks status

Admin polls:
    → GET /api/v1/admin/conditions/{id}/infographics/status
```

### Knowledge Graph Flow

```
User navigates to Knowledge Graph page
    → GET /api/v1/knowledge-graph/full
    → KnowledgeGraphController::fullGraph()
    → Queries conditions, interventions, care domains, scriptures,
      recipes, egw-references, evidence, relationships
    → Transforms into React Flow nodes + edges format
    → Returns { nodes: [...], edges: [...] }

Frontend (KnowledgeGraph.jsx):
    → Receives node/edge data
    → layoutEngine.js positions nodes using force-directed algorithm
    → React Flow renders interactive graph with custom node types:
      ConditionNode, InterventionNode, CareDomainNode, etc.
    → Custom edges show relationship types (effectiveness, synergy, etc.)
```

### Publishing Workflow

```
Content starts as "draft"
    → Editor submits for review: POST /admin/conditions/{id}/submit-for-review
    → Status changes: draft → review
    → Admin publishes: POST /admin/conditions/{id}/publish
    → Status changes: review → published
    → Admin can archive: POST /admin/conditions/{id}/archive
    → Status changes: published → archived
    → Can return to draft at any stage
```

---

## Backend Layer Architecture

### Controllers (`app/Http/Controllers/Api/`)

Controllers are thin — they handle HTTP concerns (validation, authorization, response formatting) and delegate business logic to services or Eloquent models directly.

**Pattern**: Request → Validate → Model operation → Return Resource

### Services (`app/Services/`)

Services encapsulate business logic, especially for external API integrations:

| Service | Responsibility |
|---------|---------------|
| `GeminiService` | Low-level Google Gemini API calls (chat, generate, structured output) |
| `AiContentService` | Orchestrates AI workflows: draft generation → structuring → import |
| `BibleApiService` | Bible.com API integration (verse lookup, search, translations) |
| `ImagenService` | Vertex AI Imagen API calls (image generation) |
| `InfographicGeneratorService` | Orchestrates infographic creation (prompt building + Imagen calls) |

### Jobs (`app/Jobs/`)

Async operations that run on the database queue:

| Job | What it does | Dispatched by |
|-----|-------------|---------------|
| `GenerateAiDraftJob` | Generates raw AI content via Gemini | `AiContentController@generateDraft` |
| `StructureAiContentJob` | Structures raw AI text into sections | `AiContentController@structureContent` |
| `GenerateInfographicJob` | Creates infographic via Vertex AI Imagen | `InfographicController@generate` |

All jobs use database driver with `$tries`, `$timeout`, and `$backoff` for resilience.

### Resources (`app/Http/Resources/`)

API response transformers. Every model has a corresponding Resource class that controls the JSON shape returned to clients. This ensures consistent API responses and prevents leaking internal data.

### Models (`app/Models/`)

Eloquent models with shared behavior via traits:

| Trait | What it does |
|-------|-------------|
| `HasUuids` | UUID primary keys (NOT on User — User uses auto-increment) |
| `HasAuditFields` | Tracks `created_by`, `updated_by`, `deleted_by` (foreign keys to users) |
| `HasMedia` | Polymorphic media attachments (images, documents) |
| `HasPublishingStatus` | Publishing workflow (draft → review → published → archived) |
| `HasRevisions` | Content version history with diffing and restore capability |

---

## Domain Model

The core domain is organized around medical conditions and their lifestyle medicine interventions:

```
                        BodySystem
                            │ has many
                            ▼
    ConditionCategory ◄── Condition ──► ConditionSection
                            │               (overview, pathophysiology, solutions)
                            │
              ┌─────────────┼─────────────────────────┐
              │             │                          │
              ▼             ▼                          ▼
         Scripture    Intervention                EgwReference
              │             │
              │    ┌────────┼────────┐
              │    │        │        │
              │    ▼        ▼        ▼
              │  Protocol  Evidence  Recipe
              │    │       Entry
              │    ▼
              │  ProtocolStep
              │
              ▼
         CareDomain ◄── Intervention
                            │
                  ┌─────────┼──────────┐
                  │         │          │
                  ▼         ▼          ▼
          Contraindication Outcome  Effectiveness
                                   (per condition-
                                    intervention pair)

    InterventionRelationship (synergy/conflict between interventions)
    EvidenceSummary (per condition-intervention pair)
    ContentRevision (version history for any content type)
    ContentTag (polymorphic tagging)
    Media (polymorphic media attachments)
```

### Key Relationships

- **Condition ↔ Intervention**: Many-to-many with pivot data (effectiveness, ordering)
- **Condition ↔ Scripture/Recipe/EgwReference**: Many-to-many
- **Intervention → CareDomain**: Belongs-to (each intervention is in one NEWSTART+ domain)
- **Intervention → Protocol → Steps**: One-to-one-to-many (treatment protocol with ordered steps)
- **Intervention ↔ Intervention**: Self-referential via InterventionRelationship (synergies/conflicts)
- **Condition → BodySystem → ConditionCategory**: Hierarchical medical taxonomy
- **Everything → Media**: Polymorphic (any content type can have images/files)
- **Everything → ContentTag**: Polymorphic tagging system
- **Everything → ContentRevision**: Version history for any content type

---

## Admin Dashboard Frontend Architecture

### Feature-Based Organization

Each feature is a self-contained module:

```
features/
├── conditions/           # CRUD + relationships for medical conditions
│   ├── Conditions.jsx    # List page (table/card views, search, filters)
│   ├── ConditionForm.jsx # Create/edit form (rich text, relationships)
│   ├── ConditionDetail.jsx # Detail view with all relationships
│   └── components/       # Feature-specific sub-components
├── knowledge-graph/      # Interactive React Flow visualization
│   ├── nodes/            # Custom node renderers per entity type
│   ├── edges/            # Custom edge renderers per relationship type
│   ├── controls/         # Panels, filters, search, export
│   ├── hooks/            # Keyboard shortcuts, layout persistence
│   ├── utils/            # Layout algorithms (force-directed)
│   └── mindmap/          # Condition-specific mindmap view
│       ├── nodes/        # Mindmap-specific node types
│       ├── edges/        # Mindmap edge styles
│       ├── hooks/        # Data fetching and layout
│       └── utils/        # Mindmap layout algorithms
├── ai-generator/         # AI content generation wizard
├── analytics/            # Dashboard charts and metrics
└── ...                   # Other CRUD features
```

### State Management

- **AuthContext**: Token storage, user state, 30-minute inactivity timeout, login/logout
- **NotificationContext**: Toast notifications via SweetAlert2
- **Component-level state**: React `useState`/`useEffect` for page-specific data (no global store like Redux)

### API Communication

All API calls go through `lib/api.js`, an Axios instance configured with:
- Base URL (`/api/v1`)
- Authorization header injection (bearer token from AuthContext)
- Response interceptors (401 → redirect to login)
- Request/response error handling

---

## Authentication & Authorization

### Authentication Flow

1. User submits credentials → `POST /api/v1/login`
2. `AuthController` validates → creates Sanctum personal access token
3. Token returned to frontend → stored in AuthContext (memory + localStorage)
4. Subsequent requests include `Authorization: Bearer {token}` header
5. 30-minute inactivity timeout on frontend auto-logs out

### Role-Based Access Control

Three roles enforced by `CheckRole` middleware:

| Role | Permissions |
|------|------------|
| `admin` | Full access: CRUD all content, publish/archive, user management, AI generation, imports, analytics |
| `editor` | Content management: CRUD content, submit for review, return to draft, AI suggestions |
| `viewer` | Read-only: Can only view content through public endpoints |

### Route Protection Layers

```
Public routes:     throttle:api (60/min)
Auth routes:       auth:sanctum
Editor routes:     auth:sanctum + role:admin,editor
Admin routes:      auth:sanctum + role:admin
AI routes:         auth:sanctum + role:admin + throttle:ai (10/min)
Export routes:     throttle:export (10/min)
```

---

## Queue System

- **Driver**: Database (jobs stored in `jobs` table)
- **Worker**: `php artisan queue:listen --tries=1`
- **Jobs table**: Standard Laravel queue schema
- **Failure handling**: Jobs have `$tries`, `$timeout`, `$backoff` properties
- **Test mode**: Queue uses `sync` driver (jobs run immediately)

### When queues are used

Only for long-running AI operations:
1. Generating AI content drafts (Gemini API call can take 10-30s)
2. Structuring AI content (another Gemini call)
3. Generating infographics (Vertex AI Imagen call)

All other operations are synchronous.

---

## Export Capabilities

| Format | What | Endpoint |
|--------|------|----------|
| PDF | Individual condition detail | `/export/conditions/{id}/pdf` |
| PDF | All conditions summary | `/export/conditions/summary/pdf` |
| PDF | Individual recipe | `/export/recipes/{id}/pdf` |
| CSV | Evidence entries | `/export/evidence/csv` |
| CSV | References | `/export/references/csv` |
| FHIR R4 | Condition as PlanDefinition | `/export/fhir/PlanDefinition/{id}` |
| FHIR R4 | Intervention as ActivityDefinition | `/export/fhir/ActivityDefinition/{id}` |
| FHIR R4 | Capability statement | `/export/fhir/metadata` |

PDF generation uses DomPDF. FHIR exports follow the HL7 FHIR R4 specification for healthcare interoperability.

---

## Deployment

| Component | URL | Platform |
|-----------|-----|----------|
| API (Laravel) | https://api.rindra.org | HestiaCP VPS |
| Admin Dashboard | https://lifestyle.rindra.org | Static files on VPS |

- Deploy scripts: `scripts/deploy-hestia.sh` (on VPS), `scripts/remote-deploy-hestia.bat` (Windows trigger)
- CI: GitHub Actions runs tests (PHP 8.4/8.5 matrix) and linting on push/PR to main/develop

---

## Testing Strategy

- **Framework**: PHPUnit
- **Database**: SQLite in-memory (`:memory:`) for speed
- **Caveat**: MySQL-specific syntax must be guarded with `DB::getDriverName() === 'mysql'`
- **Queue**: Uses `sync` driver in tests (jobs run immediately)
- **Coverage**: Auth flows, settings, publishing workflow, content revisions
- **Known failure**: `ProfileUpdateTest::user_can_delete_their_account` (soft delete assertion mismatch)
