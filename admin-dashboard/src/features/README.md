# Feature Modules

Each directory is a self-contained feature module. This document explains what each one does.

## Core Content Features

### `conditions/`
Medical condition management — the central entity of the platform. Conditions are health problems (e.g., "Type 2 Diabetes", "Hypertension") that can be treated with lifestyle interventions.

**Key files:**
- `Conditions.jsx` — List page with table/card toggle, search, category filters, pagination
- `ConditionForm.jsx` — Create/edit form with rich text sections, body system picker, medical codes (SNOMED, ICD-10)
- `ConditionDetail.jsx` — Full detail view showing sections, attached interventions, scriptures, recipes, EGW references, evidence
- `ConditionPreview.jsx` / `ConditionPreviewModal.jsx` — Preview before publish
- `ConditionSectionForm.jsx` — Sub-form for condition content sections (overview, pathophysiology, solutions)
- `AttachIntervention.jsx` — Search and attach interventions with effectiveness ratings
- `AttachScripture.jsx` / `AttachRecipe.jsx` / `AttachEgwReference.jsx` — Attach related content
- `components/ConditionTable.jsx` — Table view component
- `components/ConditionDetailSlideOver.jsx` — Slide-over quick detail panel

### `interventions/`
Lifestyle medicine interventions — treatments and lifestyle changes (e.g., "Whole Food Plant-Based Diet", "30-Minute Daily Walking").

**Key files:**
- `Interventions.jsx` — List page with care domain filtering
- `InterventionForm.jsx` — Create/edit with care domain, description, mechanism, SNOMED code
- `InterventionDetail.jsx` — Full detail with protocols, contraindications, outcomes, evidence
- `components/ProtocolEditor.jsx` — Protocol creation/editing (duration, frequency, intensity)
- `components/ProtocolStepsList.jsx` — Ordered step management with drag-and-drop
- `components/ContraindicationsList.jsx` — Manage contraindications with severity levels
- `components/OutcomesList.jsx` — Expected outcomes with timelines

### `recipes/`
Healthy plant-based recipes linked to conditions and interventions.

### `scriptures/`
Bible verses related to health topics, linked to conditions. Supports theme-based organization.

### `egw-references/`
Ellen G. White health writings, organized by book and topic.

### `references/`
Academic literature references (journals, studies) attached to evidence entries.

### `evidence/`
Scientific evidence entries supporting intervention effectiveness. Includes study type, quality rating, findings.

### `care-domains/`
The 8 NEWSTART+ lifestyle medicine domains: Nutrition, Exercise, Water, Sunlight, Temperance, Air, Rest, Trust in God (+ Social/Community). Each intervention belongs to one care domain.

### `content-tags/`
Polymorphic tagging system. Tags can be attached to any content type (conditions, interventions, recipes, etc.).

---

## Visualization Features

### `knowledge-graph/`
**The largest and most complex feature module (~42 files).**

Interactive React Flow visualization showing relationships between all entities. Two main views:

1. **Knowledge Graph** (`KnowledgeGraph.jsx`) — Full network graph of conditions, interventions, care domains, scriptures, recipes, evidence, and their relationships. Uses force-directed layout algorithm.

2. **Condition Mindmap** (`mindmap/ConditionMindmap.jsx`) — Focused tree/radial view for a single condition showing its sections, interventions, risk factors, and complications.

**Sub-directories:**
- `nodes/` — Custom React Flow node components (one per entity type, with distinct colors/icons)
- `edges/` — Custom edge renderers showing relationship types and effectiveness levels
- `controls/` — UI panels (filter, search, export, context menu, details panel, legend)
- `hooks/` — Keyboard shortcuts, layout state persistence
- `utils/` — Layout algorithms (force-directed positioning, collision resolution)
- `mindmap/` — Separate mindmap implementation with its own nodes, edges, hooks, and layout utils

### `analytics/`
Dashboard with charts showing platform metrics:
- `OverviewCards.jsx` — Total counts (conditions, interventions, etc.)
- `GrowthLineChart.jsx` — Content growth over time
- `DomainBarChart.jsx` — Interventions per care domain
- `CategoryPieChart.jsx` — Conditions per category
- `QualityDistribution.jsx` — Evidence quality breakdown
- `ContentCompleteness.jsx` — Content completeness scores
- `ActivityTimeline.jsx` — Recent user activity

---

## Utility Features

### `ai-generator/`
AI-powered content generation wizard (admin only):
1. `ConditionInput.jsx` — Enter condition name to generate
2. `AiContentGenerator.jsx` — Orchestrates the multi-step AI workflow
3. `DraftReview.jsx` — Review raw AI draft
4. `StructuredPreview.jsx` — Preview structured content before import
5. `ImportProgress.jsx` — Shows import progress
6. `InfographicGenerator.jsx` — Generate condition infographics via Vertex AI

### `bible/`
Bible explorer (`BibleExplorer.jsx`) — search verses, browse books/chapters, view health-themed scriptures, daily verse.

### `search/`
Global search across all content types (`Search.jsx`).

### `import/`
Bulk data import from Excel/CSV files (`Import.jsx`). Supports conditions and interventions.

### `dashboard/`
Admin home page (`Dashboard.jsx`) with quick stats and recent activity.

### `auth/`
Login page (`Login.jsx`). Authentication is handled by `AuthContext`.

### `profile/`
User profile management (`Profile.jsx`) — update name, email, password.

### `users/`
User management (`Users.jsx`, `UserForm.jsx`) — admin-only CRUD for user accounts with role assignment and active/inactive toggle.
