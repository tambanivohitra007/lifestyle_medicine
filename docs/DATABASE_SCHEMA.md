# Database Schema

This document describes the database tables, their purposes, and key relationships.

---

## Entity Relationship Overview

```
users (auto-increment PK)
    ├── created_by/updated_by/deleted_by on most content tables

conditions (UUID PK)
    ├── belongs_to body_systems
    ├── has_many condition_sections
    ├── has_many condition_risk_factors
    ├── has_many condition_complications
    ├── many-to-many interventions (via condition_interventions)
    ├── many-to-many scriptures (via condition_scriptures)
    ├── many-to-many recipes (via condition_recipes)
    ├── many-to-many egw_references (via condition_egw_reference)
    ├── has_many evidence_summaries
    ├── has_many intervention_effectiveness
    └── polymorphic media, content_revisions

interventions (UUID PK)
    ├── belongs_to care_domains
    ├── has_one intervention_protocols
    ├── has_many evidence_entries
    ├── has_many intervention_contraindications
    ├── has_many intervention_outcomes
    ├── has_many intervention_effectiveness
    ├── has_many intervention_relationships (self-referential)
    ├── many-to-many conditions (via condition_interventions)
    ├── many-to-many tags (via intervention_tag)
    └── polymorphic media, content_revisions

body_systems (UUID PK)
    └── has_many condition_categories

care_domains (UUID PK)
    └── has_many interventions

intervention_protocols (UUID PK)
    └── has_many protocol_steps
```

---

## Core Content Tables

### `conditions`
Medical health conditions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `name` | varchar | Condition name (e.g., "Type 2 Diabetes") |
| `slug` | varchar | URL-friendly name |
| `category` | varchar, nullable | Legacy category field |
| `summary` | text, nullable | Brief description |
| `snomed_code` | varchar, nullable | SNOMED CT code |
| `icd10_code` | varchar, nullable | ICD-10 code |
| `body_system_id` | UUID (FK), nullable | Reference to body_systems |
| `status` | enum | draft, review, published, archived |
| `created_by` / `updated_by` / `deleted_by` | bigint (FK to users) | Audit fields |
| `created_at` / `updated_at` / `deleted_at` | timestamps | Laravel timestamps + soft delete |

### `condition_sections`
Content sections for a condition (overview, pathophysiology, lifestyle solutions).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `condition_id` | UUID (FK) | Parent condition |
| `type` | varchar | Section type (overview, pathophysiology, solutions, etc.) |
| `title` | varchar | Section title |
| `content` | longtext | Rich text content (HTML) |
| `order` | integer | Display order |

### `interventions`
Lifestyle medicine interventions (treatments).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `care_domain_id` | UUID (FK) | NEWSTART+ domain |
| `name` | varchar | Intervention name |
| `slug` | varchar | URL-friendly name |
| `description` | text, nullable | Full description |
| `mechanism` | text, nullable | How the intervention works |
| `snomed_code` | varchar, nullable | SNOMED CT code |
| `status` | enum | draft, review, published, archived |
| `created_by` / `updated_by` / `deleted_by` | bigint (FK to users) | |
| `created_at` / `updated_at` / `deleted_at` | timestamps | |

### `scriptures`
Bible verses related to health.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `reference` | varchar | Verse reference (e.g., "3 John 1:2") |
| `text` | text | Verse text |
| `translation` | varchar | Bible translation (KJV, NIV, etc.) |
| `theme` | varchar, nullable | Health theme |
| `explanation` | text, nullable | How verse relates to health |
| `status` | enum | draft, review, published, archived |

### `recipes`
Healthy plant-based recipes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `name` | varchar | Recipe name |
| `slug` | varchar | URL-friendly name |
| `description` | text, nullable | Recipe description |
| `ingredients` | json, nullable | Ingredient list |
| `instructions` | text, nullable | Cooking instructions |
| `prep_time_minutes` | integer, nullable | Preparation time |
| `cook_time_minutes` | integer, nullable | Cooking time |
| `servings` | integer, nullable | Number of servings |
| `nutritional_info` | json, nullable | Nutritional data |
| `status` | enum | draft, review, published, archived |

### `egw_references`
Ellen G. White health writings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `book` | varchar | Book title |
| `book_abbreviation` | varchar, nullable | Short book code |
| `chapter` | varchar, nullable | Chapter reference |
| `page_numbers` | varchar, nullable | Page range |
| `quote` | text | Quoted text |
| `topic` | varchar, nullable | Health topic |
| `explanation` | text, nullable | Context/explanation |
| `status` | enum | draft, review, published, archived |

### `references`
Academic literature references.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `title` | varchar | Publication title |
| `authors` | varchar, nullable | Author names |
| `journal` | varchar, nullable | Journal name |
| `year` | integer, nullable | Publication year |
| `doi` | varchar, nullable | DOI |
| `url` | varchar, nullable | External URL |
| `abstract` | text, nullable | Abstract text |

---

## Taxonomy Tables

### `care_domains`
NEWSTART+ lifestyle medicine domains.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `name` | varchar | Domain name (Nutrition, Exercise, etc.) |
| `slug` | varchar | URL-friendly name |
| `description` | text, nullable | Domain description |
| `icon` | varchar, nullable | Icon identifier |
| `color` | varchar, nullable | Hex color code |

### `body_systems`
Medical body system classification.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `name` | varchar | System name (Cardiovascular, Endocrine, etc.) |
| `slug` | varchar | URL-friendly name |
| `description` | text, nullable | |
| `icon` | varchar, nullable | |
| `color` | varchar, nullable | |

### `condition_categories`
Sub-categories within a body system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `body_system_id` | UUID (FK) | Parent body system |
| `name` | varchar | Category name |
| `slug` | varchar | |

### `content_tags`
Polymorphic tags for any content type.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `name` | varchar | Tag name |
| `slug` | varchar | |

**Tag junction tables:** `intervention_tag`, `recipe_tag`, `scripture_tag`, `egw_reference_tag`

---

## Relationship (Pivot) Tables

### `condition_interventions`
Many-to-many: Conditions ↔ Interventions.

| Column | Type | Description |
|--------|------|-------------|
| `condition_id` | UUID (FK) | |
| `intervention_id` | UUID (FK) | |
| `notes` | text, nullable | Relationship notes |
| `order` | integer, default 0 | Display ordering |

### `condition_scriptures`
| `condition_id` | UUID (FK) | `scripture_id` | UUID (FK) |

### `condition_recipes`
| `condition_id` | UUID (FK) | `recipe_id` | UUID (FK) |

### `condition_egw_reference` (note: singular)
| `condition_id` | UUID (FK) | `egw_reference_id` | UUID (FK) |

### `intervention_scriptures`
| `intervention_id` | UUID (FK) | `scripture_id` | UUID (FK) |

### `intervention_recipes`
| `intervention_id` | UUID (FK) | `recipe_id` | UUID (FK) |

---

## Protocol & Clinical Tables

### `intervention_protocols`
Treatment protocol for an intervention.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `intervention_id` | UUID (FK) | One protocol per intervention |
| `duration_weeks` | integer, nullable | Recommended duration |
| `frequency_per_week` | integer, nullable | Times per week |
| `intensity_level` | enum, nullable | low, moderate, high |
| `notes` | text, nullable | General protocol notes |

### `protocol_steps`
Ordered steps within a protocol.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `intervention_protocol_id` | UUID (FK) | Parent protocol |
| `step_number` | integer | Order |
| `title` | varchar | Step title |
| `description` | text, nullable | Step description |
| `duration` | varchar, nullable | Duration of this step |
| `notes` | text, nullable | Additional notes |

### `intervention_contraindications`
When NOT to use an intervention.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `intervention_id` | UUID (FK) | |
| `description` | text | Contraindication description |
| `severity` | enum | mild, moderate, severe |
| `notes` | text, nullable | |

### `intervention_outcomes`
Expected outcomes from an intervention.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `intervention_id` | UUID (FK) | |
| `description` | text | Expected outcome |
| `timeframe` | varchar, nullable | When to expect results |
| `measurement` | varchar, nullable | How to measure |
| `order` | integer | Display order |

### `intervention_effectiveness`
Evidence-based effectiveness rating for a condition-intervention pair.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `condition_id` | UUID (FK) | |
| `intervention_id` | UUID (FK) | |
| `effectiveness_rating` | enum | very_high, high, moderate, low, uncertain |
| `grade_rating` | enum, nullable | A, B, C, D (GRADE system) |
| `is_primary` | boolean | Whether this is the primary intervention |
| `summary` | text, nullable | Evidence summary text |
| `confidence_interval` | varchar, nullable | |
| `number_needed_to_treat` | integer, nullable | NNT statistic |

### `intervention_relationships`
Synergies and conflicts between two interventions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `intervention_id` | UUID (FK) | First intervention |
| `related_intervention_id` | UUID (FK) | Second intervention |
| `relationship_type` | enum | synergy, complementary, neutral, caution, conflict |
| `description` | text, nullable | Relationship description |
| `clinical_notes` | text, nullable | Clinical guidance |
| `evidence_strength` | enum, nullable | strong, moderate, weak |

### `condition_risk_factors`
Risk factors for developing a condition.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `condition_id` | UUID (FK) | |
| `name` | varchar | Risk factor name |
| `description` | text, nullable | |
| `severity` | enum, nullable | Risk severity level |

### `condition_complications`
Potential complications of a condition.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `condition_id` | UUID (FK) | |
| `name` | varchar | Complication name |
| `description` | text, nullable | |
| `severity` | enum, nullable | Severity level |

---

## Evidence Tables

### `evidence_entries`
Individual evidence records supporting an intervention.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `intervention_id` | UUID (FK) | |
| `study_type` | enum | rct, meta_analysis, systematic_review, observational, case_series, expert_opinion |
| `title` | varchar | Study title |
| `findings` | text | Key findings |
| `quality_rating` | enum, nullable | Evidence quality |
| `sample_size` | integer, nullable | Study sample size |
| `year` | integer, nullable | Study year |

### `evidence_reference` (pivot)
Links evidence entries to academic references.

| `evidence_entry_id` | UUID (FK) | `reference_id` | UUID (FK) |

### `evidence_summaries`
Aggregated evidence summary for a condition-intervention pair.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `condition_id` | UUID (FK) | |
| `intervention_id` | UUID (FK) | |
| `overall_quality` | enum | high, moderate, low, very_low |
| `summary` | text | Summary text |
| `key_findings` | json | Array of key findings |
| `limitations` | json | Array of limitations |
| `clinical_implications` | text, nullable | Clinical takeaways |
| `last_reviewed_at` | timestamp, nullable | When last reviewed |
| `reviewed_by` | bigint (FK to users), nullable | Who reviewed |

---

## Polymorphic Tables

### `media`
Polymorphic media attachments (images, documents, etc.).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `mediable_type` | varchar | Model class name |
| `mediable_id` | UUID | Model instance ID |
| `file_path` | varchar | Storage path |
| `file_name` | varchar | Original filename |
| `mime_type` | varchar | File MIME type |
| `size` | bigint | File size in bytes |
| `title` | varchar, nullable | Display title |
| `alt_text` | varchar, nullable | Accessibility text |
| `order` | integer, default 0 | Display order |

### `content_revisions`
Version history for any content type.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `revisionable_type` | varchar | Model class name |
| `revisionable_id` | UUID | Model instance ID |
| `data` | json | Snapshot of model data at this version |
| `reason` | varchar, nullable | Reason for revision |
| `created_by` | bigint (FK to users) | Who made the change |
| `created_at` | timestamp | When |

---

## AI/Generation Tables

### `ai_generation_requests`
Tracks AI content generation jobs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | bigint (FK to users) | Who requested |
| `type` | varchar | draft, structure, etc. |
| `input` | json | Input parameters |
| `output` | json, nullable | Generated content |
| `status` | enum | pending, processing, completed, failed |
| `error` | text, nullable | Error message if failed |

### `infographic_generation_requests`
Tracks infographic generation jobs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `condition_id` | UUID (FK) | Target condition |
| `prompt` | text | Image generation prompt |
| `status` | enum | pending, processing, completed, failed |
| `error` | text, nullable | Error message if failed |

---

## System Tables

### `users`
**Uses auto-increment PK (NOT UUID).**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK, auto-increment) | |
| `name` | varchar | |
| `email` | varchar (unique) | |
| `role` | enum | admin, editor, viewer |
| `is_active` | boolean | Account active flag |
| `two_factor_secret` | text, nullable | 2FA secret |
| `two_factor_recovery_codes` | text, nullable | Recovery codes |
| `deleted_at` | timestamp, nullable | Soft delete |

### `personal_access_tokens`
Sanctum API tokens.

### `jobs` / `failed_jobs`
Laravel queue tables.

### `cache` / `sessions`
Laravel cache and session storage.
