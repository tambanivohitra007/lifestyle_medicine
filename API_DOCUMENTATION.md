# Lifestyle Medicine & GME API Documentation

## Overview

RESTful API for the Lifestyle Medicine and Gospel Medical Evangelism Knowledge Platform. This API provides access to evidence-based lifestyle medicine interventions, clinical content, and spiritual care resources.

## Base URL

```
Local: http://localhost:8000/api/v1
```

## Authentication

Protected endpoints (admin routes) require authentication using Laravel Sanctum.

### Admin Routes
All admin routes are prefixed with `/api/v1/admin` and require authentication:

```http
Authorization: Bearer {your-token}
```

## Public API Endpoints (Read-Only)

### Care Domains

**List all care domains**
```http
GET /api/v1/care-domains
```

**Get single care domain**
```http
GET /api/v1/care-domains/{id}
```

### Conditions

**List all conditions**
```http
GET /api/v1/conditions
```

Query Parameters:
- `category` - Filter by category
- `search` - Search in name and summary
- `page` - Page number for pagination

**Get single condition**
```http
GET /api/v1/conditions/{id}
```

**Get condition sections**
```http
GET /api/v1/conditions/{id}/sections
```

**Get condition interventions**
```http
GET /api/v1/conditions/{id}/interventions
```

**Get condition scriptures**
```http
GET /api/v1/conditions/{id}/scriptures
```

**Get condition recipes**
```http
GET /api/v1/conditions/{id}/recipes
```

### Interventions

**List all interventions**
```http
GET /api/v1/interventions
```

Query Parameters:
- `care_domain_id` - Filter by care domain
- `search` - Search in name and description
- `page` - Page number for pagination

**Get single intervention**
```http
GET /api/v1/interventions/{id}
```

**Get intervention evidence**
```http
GET /api/v1/interventions/{id}/evidence
```

**Get intervention conditions**
```http
GET /api/v1/interventions/{id}/conditions
```

### Evidence & References

**List evidence entries**
```http
GET /api/v1/evidence-entries
```

Query Parameters:
- `intervention_id` - Filter by intervention
- `study_type` - Filter by study type (rct, meta_analysis, etc.)
- `quality_rating` - Filter by quality (A, B, C, D)

**Get single evidence entry**
```http
GET /api/v1/evidence-entries/{id}
```

**List references**
```http
GET /api/v1/references
```

Query Parameters:
- `search` - Search in citation, DOI, or PMID
- `year` - Filter by publication year

**Get single reference**
```http
GET /api/v1/references/{id}
```

### Scriptures

**List scriptures**
```http
GET /api/v1/scriptures
```

Query Parameters:
- `theme` - Filter by theme
- `search` - Search in reference, text, or theme

**Get single scripture**
```http
GET /api/v1/scriptures/{id}
```

### Recipes

**List recipes**
```http
GET /api/v1/recipes
```

Query Parameters:
- `search` - Search in title and description
- `dietary_tag` - Filter by dietary tag

**Get single recipe**
```http
GET /api/v1/recipes/{id}
```

### Content Tags

**List content tags**
```http
GET /api/v1/content-tags
```

**Get single tag**
```http
GET /api/v1/content-tags/{id}
```

## Admin API Endpoints (Protected)

All admin endpoints require authentication. Replace `{resource}` with the appropriate endpoint.

### Create Resource
```http
POST /api/v1/admin/{resource}
Content-Type: application/json

{
  // Resource-specific fields
}
```

### Update Resource
```http
PUT /api/v1/admin/{resource}/{id}
Content-Type: application/json

{
  // Fields to update
}
```

### Delete Resource
```http
DELETE /api/v1/admin/{resource}/{id}
```

### Relationship Management

**Attach intervention to condition**
```http
POST /api/v1/admin/conditions/{condition_id}/interventions/{intervention_id}
Content-Type: application/json

{
  "strength_of_evidence": "high",
  "recommendation_level": "core",
  "clinical_notes": "Optional notes",
  "order_index": 0
}
```

**Detach intervention from condition**
```http
DELETE /api/v1/admin/conditions/{condition_id}/interventions/{intervention_id}
```

**Attach scripture to condition**
```http
POST /api/v1/admin/conditions/{condition_id}/scriptures/{scripture_id}
```

**Detach scripture from condition**
```http
DELETE /api/v1/admin/conditions/{condition_id}/scriptures/{scripture_id}
```

**Attach recipe to condition**
```http
POST /api/v1/admin/conditions/{condition_id}/recipes/{recipe_id}
```

**Detach recipe from condition**
```http
DELETE /api/v1/admin/conditions/{condition_id}/recipes/{recipe_id}
```

## Resource Schemas

### Condition
```json
{
  "id": "uuid",
  "name": "string",
  "category": "string|null",
  "summary": "string|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Intervention
```json
{
  "id": "uuid",
  "care_domain_id": "integer",
  "name": "string",
  "description": "string|null",
  "mechanism": "string|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Evidence Entry
```json
{
  "id": "uuid",
  "intervention_id": "uuid",
  "study_type": "rct|meta_analysis|systematic_review|observational|case_series|expert_opinion",
  "population": "string|null",
  "quality_rating": "A|B|C|D|null",
  "summary": "string",
  "notes": "string|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Reference
```json
{
  "id": "uuid",
  "citation": "string",
  "doi": "string|null",
  "pmid": "string|null",
  "url": "string|null",
  "year": "integer|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Scripture
```json
{
  "id": "uuid",
  "reference": "string",
  "text": "string",
  "theme": "string|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Recipe
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string|null",
  "dietary_tags": "array|null",
  "ingredients": "array|null",
  "instructions": "string|null",
  "servings": "integer|null",
  "prep_time_minutes": "integer|null",
  "cook_time_minutes": "integer|null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Response Format

### Success Response
```json
{
  "data": {
    // Resource data
  }
}
```

### Collection Response
```json
{
  "data": [
    // Array of resources
  ],
  "links": {
    "first": "url",
    "last": "url",
    "prev": "url|null",
    "next": "url|null"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 20,
    "to": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": {
    "field": ["Validation error"]
  }
}
```

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Resource deleted
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed
- `500 Internal Server Error` - Server error

## Examples

### Get Condition with Interventions

**Request:**
```http
GET /api/v1/conditions/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Type 2 Diabetes",
    "category": "Metabolic",
    "summary": "Chronic condition affecting blood sugar regulation",
    "sections": [...],
    "interventions": [
      {
        "id": "uuid",
        "name": "Whole Food Plant-Based Diet",
        "care_domain": {
          "id": 1,
          "name": "Nutrition"
        },
        "pivot": {
          "strength_of_evidence": "high",
          "recommendation_level": "core",
          "clinical_notes": "Multiple RCTs demonstrate reversal",
          "order_index": 0
        }
      }
    ],
    "created_at": "2026-01-23T01:00:00.000000Z",
    "updated_at": "2026-01-23T01:00:00.000000Z"
  }
}
```

### Create New Condition (Admin)

**Request:**
```http
POST /api/v1/admin/conditions
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Obesity",
  "category": "Metabolic",
  "summary": "Excess body fat that increases health risks"
}
```

**Response:**
```json
{
  "data": {
    "id": "new-uuid",
    "name": "Obesity",
    "category": "Metabolic",
    "summary": "Excess body fat that increases health risks",
    "created_at": "2026-01-23T01:00:00.000000Z",
    "updated_at": "2026-01-23T01:00:00.000000Z"
  }
}
```

## Getting Started

### Prerequisites
- PHP 8.2+
- MySQL 8.0+
- Composer

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

**Test User:**
- Email: test@example.com
- Password: password

## Support

For issues or questions, please contact the development team.
