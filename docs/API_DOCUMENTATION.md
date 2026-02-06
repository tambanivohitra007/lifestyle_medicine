# Lifestyle Medicine Knowledge Platform API Documentation

## Overview

RESTful API for the Lifestyle Medicine Knowledge Platform. This API provides access to evidence-based lifestyle medicine interventions, clinical content, spiritual care resources, and FHIR R4 export capabilities.

**Base URL:** `https://your-domain.com/api/v1`

---

## Authentication

### Public Endpoints
Most read-only endpoints are publicly accessible without authentication. Rate limits apply.

### Protected Endpoints
Admin and editor endpoints require authentication via Laravel Sanctum.

```bash
# Login to get a token
POST /api/v1/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}

# Response
{
  "token": "your-bearer-token",
  "user": { ... }
}
```

Use the token in subsequent requests:
```bash
Authorization: Bearer your-bearer-token
```

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 60 requests | 1 minute |
| Exports (PDF, CSV, FHIR) | 10 requests | 1 minute |
| AI Endpoints | 10 requests | 1 minute |
| Login | 5 attempts | 1 minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

---

## Core Resources

### Conditions

Health conditions with associated interventions, scriptures, and recipes.

#### List Conditions
```http
GET /conditions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name or summary |
| `category` | string | Filter by category |
| `body_system` | uuid | Filter by body system ID |
| `per_page` | integer | Results per page (default: 15) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Type 2 Diabetes",
      "slug": "type-2-diabetes",
      "summary": "...",
      "category": "metabolic",
      "snomed_code": "44054006",
      "icd10_code": "E11",
      "body_system": { "id": "uuid", "name": "Endocrine System" },
      "interventions_count": 8
    }
  ],
  "meta": { "current_page": 1, "last_page": 5, "total": 72 }
}
```

#### Get Condition
```http
GET /conditions/{id}
```

#### Get Complete Condition Data
Returns all related data in a single request.
```http
GET /conditions/{id}/complete
```

**Response includes:**
- Condition details with body system
- Sections (overview, pathophysiology, solutions)
- Interventions with effectiveness ratings
- Scriptures
- Recipes
- EGW References
- Evidence summaries
- Media/infographics

#### Condition Relationships
```http
GET /conditions/{id}/interventions
GET /conditions/{id}/scriptures
GET /conditions/{id}/recipes
GET /conditions/{id}/egw-references
GET /conditions/{id}/media
GET /conditions/{id}/effectiveness
GET /conditions/{id}/evidence-summaries
GET /conditions/{id}/mindmap
GET /conditions/{id}/risk-factors
GET /conditions/{id}/complications
```

---

### Interventions

Lifestyle medicine interventions with protocols and evidence.

#### List Interventions
```http
GET /interventions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name or description |
| `care_domain` | uuid | Filter by care domain ID |
| `per_page` | integer | Results per page |

#### Get Intervention
```http
GET /interventions/{id}
```

#### Intervention Details
```http
GET /interventions/{id}/protocol
GET /interventions/{id}/contraindications
GET /interventions/{id}/outcomes
GET /interventions/{id}/evidence
GET /interventions/{id}/conditions
GET /interventions/{id}/effectiveness
GET /interventions/{id}/relationships
GET /interventions/{id}/synergies
GET /interventions/{id}/conflicts
```

---

### Care Domains

The 8 domains of lifestyle medicine (Nutrition, Exercise, Sleep, Stress, Social, Substance, Faith, etc.).

```http
GET /care-domains
GET /care-domains/{id}
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Nutrition",
      "slug": "nutrition",
      "description": "Plant-based nutrition and dietary interventions",
      "icon": "utensils",
      "color": "#22c55e",
      "interventions_count": 24
    }
  ]
}
```

---

### Body Systems

Medical ontology for organizing conditions by body system.

```http
GET /body-systems
GET /body-systems/{id}
GET /body-systems/{id}/categories
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Cardiovascular System",
      "slug": "cardiovascular",
      "description": "Heart and blood vessel conditions",
      "icon": "heart",
      "color": "#ef4444",
      "conditions_count": 12
    }
  ]
}
```

---

### Intervention Effectiveness

Evidence-based effectiveness ratings for condition-intervention pairs.

```http
GET /effectiveness
GET /conditions/{id}/effectiveness
GET /interventions/{id}/effectiveness
GET /conditions/{condition}/interventions/{intervention}/effectiveness
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "condition_id": "uuid",
    "intervention_id": "uuid",
    "effectiveness_rating": "high",
    "grade_rating": "A",
    "is_primary": true,
    "summary": "Strong evidence supporting...",
    "confidence_interval": "95%",
    "number_needed_to_treat": 8
  }
}
```

**Effectiveness Ratings:**
| Rating | Description |
|--------|-------------|
| `very_high` | Strong evidence, significant clinical impact |
| `high` | Good evidence, meaningful clinical benefit |
| `moderate` | Moderate evidence, some clinical benefit |
| `low` | Limited evidence, minor benefit |
| `uncertain` | Insufficient or conflicting evidence |

**GRADE Ratings:**
- `A` - High quality evidence
- `B` - Moderate quality evidence
- `C` - Low quality evidence
- `D` - Very low quality evidence

---

### Intervention Relationships

Synergies and conflicts between interventions.

```http
GET /intervention-relationships
GET /interventions/{id}/relationships
GET /interventions/{id}/synergies
GET /interventions/{id}/conflicts
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "intervention_id": "uuid",
      "related_intervention_id": "uuid",
      "relationship_type": "synergy",
      "description": "Combined effect greater than individual effects",
      "clinical_notes": "Recommended to use together for optimal results",
      "evidence_strength": "moderate"
    }
  ]
}
```

**Relationship Types:**
| Type | Description |
|------|-------------|
| `synergy` | Interventions enhance each other's effects |
| `complementary` | Interventions work well together |
| `neutral` | No significant interaction |
| `caution` | Use together with care |
| `conflict` | Avoid combining these interventions |

---

### Evidence & References

Scientific evidence and literature references.

```http
GET /evidence-entries
GET /evidence-entries/{id}
GET /references
GET /references/{id}
GET /evidence-summaries
GET /conditions/{id}/evidence-summaries
GET /interventions/{id}/evidence-summaries
GET /conditions/{condition}/interventions/{intervention}/evidence-summary
```

**Study Types:**
- `rct` - Randomized Controlled Trial
- `meta_analysis` - Meta-Analysis
- `systematic_review` - Systematic Review
- `observational` - Observational Study
- `case_series` - Case Series
- `expert_opinion` - Expert Opinion

---

### Scriptures

Bible verses related to health and lifestyle.

```http
GET /scriptures
GET /scriptures/{id}
```

---

### EGW References

Ellen G. White health writings.

```http
GET /egw-references
GET /egw-references/{id}
GET /egw-references-books
GET /egw-references-topics
GET /egw-references-abbreviations
```

---

### Recipes

Healthy plant-based recipes.

```http
GET /recipes
GET /recipes/{id}
```

---

### Knowledge Graph

Visualization data for the knowledge graph with relationships.

```http
GET /knowledge-graph/full
GET /knowledge-graph/condition/{id}
GET /knowledge-graph/intervention/{id}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "condition-uuid",
      "type": "condition",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Type 2 Diabetes",
        "entityId": "uuid",
        "summary": "...",
        "category": "metabolic",
        "snomedCode": "44054006",
        "icd10Code": "E11",
        "bodySystem": { "name": "Endocrine", "icon": "...", "color": "#..." }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-uuid",
      "source": "condition-uuid",
      "target": "intervention-uuid",
      "type": "conditionIntervention",
      "data": {
        "effectiveness": "high",
        "gradeRating": "A",
        "isPrimary": true
      }
    },
    {
      "id": "relationship-edge-uuid",
      "source": "intervention-1-uuid",
      "target": "intervention-2-uuid",
      "type": "interventionRelationship",
      "data": {
        "relationshipType": "synergy",
        "description": "Combined benefits",
        "clinicalNotes": "..."
      }
    }
  ]
}
```

---

### Global Search

Search across all content types.

```http
GET /search?q=diabetes
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required) |
| `type` | string | Filter by type (condition, intervention, recipe, etc.) |
| `limit` | integer | Max results per type (default: 5) |

---

### Bible Explorer

Search and lookup Bible verses.

```http
GET /bible/lookup?reference=John+3:16
GET /bible/search?q=health
GET /bible/translations
GET /bible/books
GET /bible/chapter?book=Genesis&chapter=1
GET /bible/daily-verse
GET /bible/health-themes
GET /bible/health-themes/{themeKey}
GET /bible/search-health?q=body
```

---

## Export Endpoints

### PDF Exports

```http
GET /export/conditions/{id}/pdf
GET /export/conditions/summary/pdf
GET /export/recipes/{id}/pdf
```

**Enhanced Condition PDF includes:**
- Medical codes (SNOMED CT, ICD-10)
- Body system classification
- Intervention effectiveness ratings
- Protocol steps with timing
- Expected outcomes with timelines
- Contraindications with severity levels
- Evidence summaries

### CSV Exports

```http
GET /export/evidence/csv
GET /export/references/csv
```

---

## FHIR R4 API

The platform supports FHIR R4 format for healthcare interoperability.

### Capability Statement
```http
GET /export/fhir/metadata
```

Returns a FHIR CapabilityStatement describing available resources.

**Response:**
```json
{
  "resourceType": "CapabilityStatement",
  "id": "lifestyle-medicine-capability",
  "fhirVersion": "4.0.1",
  "format": ["application/fhir+json"],
  "rest": [{
    "mode": "server",
    "resource": [
      { "type": "PlanDefinition", ... },
      { "type": "ActivityDefinition", ... }
    ]
  }]
}
```

### PlanDefinition (Conditions)
```http
GET /export/fhir/PlanDefinition/{condition}
```

Exports a condition as a FHIR R4 PlanDefinition resource:
- SNOMED CT and ICD-10 subject codes
- Actions for each intervention with SNOMED codes
- Timing from protocols (duration, frequency)
- Goals from condition sections
- Mechanism documentation

**Response:**
```json
{
  "resourceType": "PlanDefinition",
  "id": "type-2-diabetes",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-02-06T...",
    "profile": ["http://hl7.org/fhir/StructureDefinition/PlanDefinition"]
  },
  "url": "https://your-domain/api/v1/export/fhir/PlanDefinition/type-2-diabetes",
  "name": "Type2Diabetes",
  "title": "Type 2 Diabetes",
  "type": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/plan-definition-type",
      "code": "clinical-protocol"
    }]
  },
  "status": "active",
  "subjectCodeableConcept": {
    "coding": [
      { "system": "http://snomed.info/sct", "code": "44054006" },
      { "system": "http://hl7.org/fhir/sid/icd-10-cm", "code": "E11" }
    ]
  },
  "action": [...]
}
```

### ActivityDefinition (Interventions)
```http
GET /export/fhir/ActivityDefinition/{intervention}
```

Exports an intervention as a FHIR R4 ActivityDefinition resource:
- SNOMED CT codes
- Timing and dosage from protocols
- Care domain as topic
- Expected outcomes as observation requirements

**Response:**
```json
{
  "resourceType": "ActivityDefinition",
  "id": "whole-food-plant-based-diet",
  "meta": {
    "profile": ["http://hl7.org/fhir/StructureDefinition/ActivityDefinition"]
  },
  "name": "WholeFoodPlantBasedDiet",
  "title": "Whole Food Plant-Based Diet",
  "status": "active",
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "..."
    }]
  },
  "topic": [{
    "coding": [{
      "system": "https://your-domain/api/v1/care-domains",
      "code": "nutrition"
    }]
  }],
  "timingDuration": { "value": 12, "unit": "wk" },
  "observationResultRequirement": [...]
}
```

**FHIR Response Headers:**
```
Content-Type: application/fhir+json
```

---

## Error Responses

### Standard Error Format
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

---

## Admin Endpoints

### Content Management (Editor + Admin)

Requires `role:admin` or `role:editor` authentication.

```http
# Conditions CRUD
POST   /admin/conditions
PUT    /admin/conditions/{id}
DELETE /admin/conditions/{id}

# Interventions CRUD
POST   /admin/interventions
PUT    /admin/interventions/{id}
DELETE /admin/interventions/{id}

# Body Systems
POST   /admin/body-systems
PUT    /admin/body-systems/{id}
DELETE /admin/body-systems/{id}
POST   /admin/body-systems/{id}/categories

# Condition-Intervention relationships
POST   /admin/conditions/{id}/interventions/{interventionId}
PUT    /admin/conditions/{id}/interventions/{interventionId}
DELETE /admin/conditions/{id}/interventions/{interventionId}
POST   /admin/conditions/{id}/interventions/reorder

# Protocol management
PUT    /admin/interventions/{id}/protocol
DELETE /admin/interventions/{id}/protocol
POST   /admin/interventions/{id}/protocol/steps
POST   /admin/interventions/{id}/protocol/steps/reorder
PUT    /admin/protocol-steps/{id}
DELETE /admin/protocol-steps/{id}

# Contraindications
POST   /admin/interventions/{id}/contraindications
PUT    /admin/contraindications/{id}
DELETE /admin/contraindications/{id}

# Outcomes
POST   /admin/interventions/{id}/outcomes
POST   /admin/interventions/{id}/outcomes/reorder
PUT    /admin/outcomes/{id}
DELETE /admin/outcomes/{id}

# Effectiveness ratings
POST   /admin/effectiveness
PUT    /admin/effectiveness/{id}
DELETE /admin/effectiveness/{id}

# Intervention relationships
POST   /admin/intervention-relationships
PUT    /admin/intervention-relationships/{id}
DELETE /admin/intervention-relationships/{id}

# Evidence summaries
POST   /admin/evidence-summaries
PUT    /admin/evidence-summaries/{id}
DELETE /admin/evidence-summaries/{id}
POST   /admin/evidence-summaries/{id}/mark-reviewed
```

### Admin Only Endpoints

Requires `role:admin` authentication.

```http
# User management
GET    /admin/users
POST   /admin/users
PUT    /admin/users/{id}
DELETE /admin/users/{id}
POST   /admin/users/{id}/toggle-active
POST   /admin/users/{id}/restore

# Data import
POST   /admin/import/conditions
POST   /admin/import/interventions
GET    /admin/import/templates

# AI content generation
GET    /admin/ai/status
POST   /admin/ai/generate-draft
POST   /admin/ai/structure-content
POST   /admin/ai/import-content
POST   /admin/ai/suggest-scriptures
POST   /admin/ai/suggest-egw-references

# Infographic generation
POST   /admin/conditions/{id}/infographics/generate
POST   /admin/infographics/{id}/retry
GET    /admin/infographics/status
GET    /admin/conditions/{id}/infographics

# Analytics
GET    /admin/analytics/overview
GET    /admin/analytics/conditions-by-category
GET    /admin/analytics/interventions-by-domain
GET    /admin/analytics/growth
GET    /admin/analytics/user-activity
GET    /admin/analytics/evidence-quality
GET    /admin/analytics/content-completeness
GET    /admin/analytics/export
```

---

## Resource Schemas

### Condition
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "category": "string|null",
  "summary": "string|null",
  "snomed_code": "string|null",
  "icd10_code": "string|null",
  "body_system_id": "uuid|null",
  "body_system": {
    "id": "uuid",
    "name": "string",
    "icon": "string",
    "color": "string"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Intervention
```json
{
  "id": "uuid",
  "care_domain_id": "uuid",
  "name": "string",
  "description": "string|null",
  "mechanism": "string|null",
  "snomed_code": "string|null",
  "care_domain": {
    "id": "uuid",
    "name": "string",
    "color": "string"
  },
  "protocol": {
    "duration_weeks": "integer|null",
    "frequency_per_week": "integer|null",
    "intensity_level": "low|moderate|high|null",
    "steps": [...]
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Intervention Effectiveness
```json
{
  "id": "uuid",
  "condition_id": "uuid",
  "intervention_id": "uuid",
  "effectiveness_rating": "very_high|high|moderate|low|uncertain",
  "grade_rating": "A|B|C|D|null",
  "is_primary": "boolean",
  "summary": "string|null",
  "confidence_interval": "string|null",
  "number_needed_to_treat": "integer|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Intervention Relationship
```json
{
  "id": "uuid",
  "intervention_id": "uuid",
  "related_intervention_id": "uuid",
  "relationship_type": "synergy|complementary|neutral|caution|conflict",
  "description": "string|null",
  "clinical_notes": "string|null",
  "evidence_strength": "strong|moderate|weak|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Evidence Summary
```json
{
  "id": "uuid",
  "condition_id": "uuid",
  "intervention_id": "uuid",
  "overall_quality": "high|moderate|low|very_low",
  "summary": "string",
  "key_findings": "array",
  "limitations": "array",
  "clinical_implications": "string|null",
  "last_reviewed_at": "timestamp|null",
  "reviewed_by": "uuid|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## Getting Started

### Prerequisites
- PHP 8.2+
- MySQL 8.0+
- Composer
- Node.js 18+ (for admin dashboard)

### Installation

1. Install dependencies:
```bash
composer install
```

2. Configure environment:
```bash
cp .env.example .env
php artisan key:generate
```

3. Update `.env` with database credentials

4. Run migrations:
```bash
php artisan migrate
```

5. Seed database:
```bash
php artisan db:seed
```

6. Start server:
```bash
php artisan serve
```

### Test Accounts

After seeding, use these credentials:

**Admin:**
- Email: admin@example.com
- Password: password

**Editor:**
- Email: editor@example.com
- Password: password

---

## Changelog

### v1.2.0 (Current)
- Added FHIR R4 export support (PlanDefinition, ActivityDefinition)
- Added intervention effectiveness ratings with GRADE system
- Added intervention relationships (synergies, conflicts)
- Added body systems medical ontology
- Enhanced PDF exports with protocols, outcomes, and contraindications
- Added evidence summaries with review workflow

### v1.1.0
- Added knowledge graph visualization endpoints
- Added condition mindmaps with risk factors and complications
- Added intervention protocols with steps, contraindications, outcomes
- Added AI-powered content generation and suggestions

### v1.0.0
- Initial API release
- Full CRUD for all resources
- Authentication with Laravel Sanctum
- Rate limiting
- CSV and PDF exports
