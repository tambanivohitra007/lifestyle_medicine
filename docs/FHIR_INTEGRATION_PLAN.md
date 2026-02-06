# FHIR Integration Plan for Lifestyle Medicine System

## Overview

This document outlines how the Lifestyle Medicine system can integrate with **FHIR (Fast Healthcare Interoperability Resources)** to enable interoperability with Electronic Health Records (EHRs), patient portals, and healthcare systems.

**References:**
- [FHIR Implementation Guide Registry](https://www.fhir.org/guides/registry/)
- [FHIR RESTful API](https://build.fhir.org/http.html)
- [Multiple Chronic Condition Care Plan IG](https://simplifier.net/packages/hl7.fhir.us.mcc/1.0.0)

---

## Part 1: FHIR API Overview

### Core HTTP Operations

| Operation | HTTP Method | Endpoint | Description |
|-----------|-------------|----------|-------------|
| **Read** | GET | `[base]/[type]/[id]` | Retrieve a specific resource |
| **Search** | GET/POST | `[base]/[type]?[params]` | Query resources with filters |
| **Create** | POST | `[base]/[type]` | Create new resource (server assigns ID) |
| **Update** | PUT | `[base]/[type]/[id]` | Replace entire resource |
| **Patch** | PATCH | `[base]/[type]/[id]` | Partial update |
| **Delete** | DELETE | `[base]/[type]/[id]` | Remove resource |
| **History** | GET | `[base]/[type]/[id]/_history` | Get version history |
| **Capabilities** | GET | `[base]/metadata` | Server capabilities |
| **Batch/Transaction** | POST | `[base]` | Multiple operations in one request |

### Content Types

```
application/fhir+json    (JSON format - recommended)
application/fhir+xml     (XML format)
```

### Common HTTP Headers

**Request Headers:**
```http
Accept: application/fhir+json
Content-Type: application/fhir+json
Authorization: Bearer <token>
If-Match: W/"<versionId>"        # For conditional updates
If-None-Exist: identifier=<value> # Prevent duplicates
Prefer: return=representation    # Return full resource after operation
```

**Response Headers:**
```http
ETag: W/"<versionId>"            # Resource version
Last-Modified: <datetime>        # Modification timestamp
Location: <resource-url>         # New resource location
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful read/update |
| 201 | Created - New resource created |
| 204 | No Content - Successful delete |
| 304 | Not Modified - Conditional read unchanged |
| 400 | Bad Request - Malformed request |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Version conflict |
| 410 | Gone - Resource deleted |
| 422 | Unprocessable Entity - Business rule violation |

---

## Part 2: Relevant FHIR Resources

### Resource Mapping to Lifestyle Medicine System

| FHIR Resource | Purpose | System Equivalent |
|---------------|---------|-------------------|
| **Patient** | Patient demographics | `users` (role=patient) |
| **Practitioner** | Healthcare providers | `users` (role=practitioner) |
| **Condition** | Health conditions/diagnoses | `conditions` |
| **CarePlan** | Treatment plans | `patient_care_plans` (new) |
| **Goal** | Health objectives | `goals` (new) |
| **Observation** | Vitals, labs, measurements | `observations` (new) |
| **NutritionOrder** | Dietary prescriptions | `recipes` + `interventions` |
| **ServiceRequest** | Intervention requests | `interventions` |

### FHIR Resource Examples

#### Condition Resource
```json
{
  "resourceType": "Condition",
  "id": "diabetes-type2",
  "clinicalStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
      "code": "active"
    }]
  },
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "44054006",
      "display": "Type 2 diabetes mellitus"
    }]
  },
  "subject": {
    "reference": "Patient/123"
  }
}
```

#### CarePlan Resource
```json
{
  "resourceType": "CarePlan",
  "id": "lifestyle-plan-123",
  "status": "active",
  "intent": "plan",
  "title": "Lifestyle Medicine Care Plan",
  "subject": {
    "reference": "Patient/123"
  },
  "addresses": [{
    "reference": "Condition/diabetes-type2"
  }],
  "goal": [{
    "reference": "Goal/a1c-target"
  }],
  "activity": [{
    "detail": {
      "kind": "NutritionOrder",
      "code": {
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "435581000124102",
          "display": "Plant-based diet"
        }]
      },
      "status": "in-progress",
      "description": "Follow plant-based whole food diet"
    }
  }]
}
```

#### Goal Resource
```json
{
  "resourceType": "Goal",
  "id": "a1c-target",
  "lifecycleStatus": "active",
  "achievementStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/goal-achievement",
      "code": "in-progress"
    }]
  },
  "description": {
    "text": "Reduce HbA1c to below 6.5%"
  },
  "subject": {
    "reference": "Patient/123"
  },
  "target": [{
    "measure": {
      "coding": [{
        "system": "http://loinc.org",
        "code": "4548-4",
        "display": "Hemoglobin A1c"
      }]
    },
    "detailQuantity": {
      "value": 6.5,
      "unit": "%",
      "system": "http://unitsofmeasure.org",
      "code": "%"
    },
    "dueDate": "2026-06-01"
  }]
}
```

#### Observation Resource
```json
{
  "resourceType": "Observation",
  "id": "bp-reading-001",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/observation-category",
      "code": "vital-signs"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "85354-9",
      "display": "Blood pressure panel"
    }]
  },
  "subject": {
    "reference": "Patient/123"
  },
  "effectiveDateTime": "2026-02-06T10:30:00Z",
  "component": [{
    "code": {
      "coding": [{
        "system": "http://loinc.org",
        "code": "8480-6",
        "display": "Systolic blood pressure"
      }]
    },
    "valueQuantity": {
      "value": 120,
      "unit": "mmHg"
    }
  }, {
    "code": {
      "coding": [{
        "system": "http://loinc.org",
        "code": "8462-4",
        "display": "Diastolic blood pressure"
      }]
    },
    "valueQuantity": {
      "value": 80,
      "unit": "mmHg"
    }
  }]
}
```

---

## Part 3: Implementation Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lifestyle Medicine System                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Backend    │    │   Database   │      │
│  │   (React)    │◄──►│   (Laravel)  │◄──►│   (MySQL)    │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │  FHIR Service   │                          │
│                    │  Layer          │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │  Epic EHR   │  │   Cerner    │  │ Apple/Google│
     │  FHIR API   │  │  FHIR API   │  │ Health APIs │
     └─────────────┘  └─────────────┘  └─────────────┘
```

### Directory Structure

```
app/
├── Fhir/
│   ├── Client/
│   │   └── FhirClient.php           # HTTP client for external FHIR servers
│   ├── Resources/
│   │   ├── PatientResource.php      # Patient FHIR mapping
│   │   ├── ConditionResource.php    # Condition FHIR mapping
│   │   ├── CarePlanResource.php     # CarePlan FHIR mapping
│   │   ├── GoalResource.php         # Goal FHIR mapping
│   │   ├── ObservationResource.php  # Observation FHIR mapping
│   │   └── NutritionOrderResource.php
│   ├── Services/
│   │   ├── FhirExportService.php    # Export data as FHIR
│   │   ├── FhirImportService.php    # Import from FHIR servers
│   │   └── FhirBundleService.php    # Bundle operations
│   └── Transformers/
│       ├── ConditionTransformer.php
│       ├── InterventionTransformer.php
│       └── RecipeTransformer.php
├── Http/
│   └── Controllers/
│       └── Fhir/
│           ├── FhirConditionController.php
│           ├── FhirCarePlanController.php
│           ├── FhirPatientController.php
│           └── FhirCapabilityController.php
└── Models/
    ├── Goal.php                     # New model
    ├── Observation.php              # New model
    └── PatientCarePlan.php          # New model
```

---

## Part 4: Database Schema Extensions

### New Tables

```sql
-- Patient Goals
CREATE TABLE goals (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    condition_id BIGINT UNSIGNED NULL,
    care_plan_id BIGINT UNSIGNED NULL,

    -- Goal details
    description TEXT NOT NULL,
    lifecycle_status ENUM('proposed', 'planned', 'accepted', 'active',
                          'on-hold', 'completed', 'cancelled', 'rejected') DEFAULT 'proposed',
    achievement_status ENUM('in-progress', 'improving', 'worsening',
                            'no-change', 'achieved', 'sustaining',
                            'not-achieved', 'no-progress') NULL,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',

    -- Target
    target_measure VARCHAR(255) NULL,      -- e.g., "HbA1c", "Weight", "Blood Pressure"
    target_value DECIMAL(10,2) NULL,
    target_unit VARCHAR(50) NULL,
    target_date DATE NULL,

    -- FHIR coding
    loinc_code VARCHAR(20) NULL,
    snomed_code VARCHAR(20) NULL,

    start_date DATE NULL,
    status_date DATE NULL,
    notes TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE SET NULL,
    INDEX idx_patient_status (patient_id, lifecycle_status),
    INDEX idx_condition (condition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Patient Observations (vitals, labs, measurements)
CREATE TABLE observations (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    goal_id BIGINT UNSIGNED NULL,
    practitioner_id BIGINT UNSIGNED NULL,

    -- Observation details
    status ENUM('registered', 'preliminary', 'final', 'amended',
                'corrected', 'cancelled', 'entered-in-error') DEFAULT 'final',
    category VARCHAR(50) NOT NULL,         -- vital-signs, laboratory, etc.
    type VARCHAR(100) NOT NULL,            -- weight, blood_pressure, a1c, etc.

    -- Value (supports different types)
    value_quantity DECIMAL(10,2) NULL,
    value_unit VARCHAR(50) NULL,
    value_string VARCHAR(255) NULL,
    value_boolean BOOLEAN NULL,

    -- For multi-component observations (e.g., blood pressure)
    components JSON NULL,

    -- Timing
    effective_datetime DATETIME NOT NULL,
    issued_datetime DATETIME NULL,

    -- FHIR coding
    loinc_code VARCHAR(20) NULL,
    snomed_code VARCHAR(20) NULL,

    -- Reference ranges
    reference_low DECIMAL(10,2) NULL,
    reference_high DECIMAL(10,2) NULL,
    interpretation VARCHAR(50) NULL,       -- normal, high, low, critical

    notes TEXT NULL,
    device VARCHAR(255) NULL,              -- Source device/app

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient_type (patient_id, type),
    INDEX idx_patient_date (patient_id, effective_datetime),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Patient Care Plans
CREATE TABLE patient_care_plans (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NULL,

    -- Care plan details
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('draft', 'active', 'on-hold', 'revoked',
                'completed', 'entered-in-error') DEFAULT 'draft',
    intent ENUM('proposal', 'plan', 'order', 'option', 'directive') DEFAULT 'plan',

    -- Period
    period_start DATE NULL,
    period_end DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient_status (patient_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Care Plan to Conditions (addresses)
CREATE TABLE care_plan_conditions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    care_plan_id BIGINT UNSIGNED NOT NULL,
    condition_id BIGINT UNSIGNED NOT NULL,

    FOREIGN KEY (care_plan_id) REFERENCES patient_care_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_condition (care_plan_id, condition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Care Plan to Goals
CREATE TABLE care_plan_goals (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    care_plan_id BIGINT UNSIGNED NOT NULL,
    goal_id BIGINT UNSIGNED NOT NULL,

    FOREIGN KEY (care_plan_id) REFERENCES patient_care_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_goal (care_plan_id, goal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Care Plan Activities (interventions)
CREATE TABLE care_plan_activities (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    care_plan_id BIGINT UNSIGNED NOT NULL,
    intervention_id BIGINT UNSIGNED NOT NULL,

    -- Activity details
    status ENUM('not-started', 'scheduled', 'in-progress',
                'on-hold', 'completed', 'cancelled', 'stopped') DEFAULT 'not-started',
    frequency VARCHAR(100) NULL,           -- e.g., "daily", "3x/week"
    scheduled_timing JSON NULL,            -- FHIR Timing structure
    notes TEXT NULL,

    FOREIGN KEY (care_plan_id) REFERENCES patient_care_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_intervention (care_plan_id, intervention_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add FHIR identifiers to existing tables
ALTER TABLE conditions ADD COLUMN icd10_code VARCHAR(20) NULL AFTER description;
ALTER TABLE conditions ADD COLUMN snomed_code VARCHAR(20) NULL AFTER icd10_code;

ALTER TABLE interventions ADD COLUMN snomed_code VARCHAR(20) NULL AFTER description;
ALTER TABLE interventions ADD COLUMN loinc_code VARCHAR(20) NULL AFTER snomed_code;

ALTER TABLE users ADD COLUMN fhir_id VARCHAR(255) NULL AFTER id;
ALTER TABLE users ADD COLUMN mrn VARCHAR(100) NULL COMMENT 'Medical Record Number' AFTER fhir_id;
```

---

## Part 5: Laravel Implementation

### FHIR Client Service

```php
<?php
// app/Fhir/Client/FhirClient.php

namespace App\Fhir\Client;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

class FhirClient
{
    protected string $baseUrl;
    protected ?string $accessToken;

    public function __construct(string $baseUrl, ?string $accessToken = null)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->accessToken = $accessToken;
    }

    /**
     * Get server capabilities
     */
    public function capabilities(): array
    {
        return $this->get('/metadata');
    }

    /**
     * Read a specific resource
     */
    public function read(string $resourceType, string $id): array
    {
        return $this->get("/{$resourceType}/{$id}");
    }

    /**
     * Search for resources
     */
    public function search(string $resourceType, array $params = []): array
    {
        return $this->get("/{$resourceType}", $params);
    }

    /**
     * Create a new resource
     */
    public function create(string $resourceType, array $resource): array
    {
        return $this->post("/{$resourceType}", $resource);
    }

    /**
     * Update an existing resource
     */
    public function update(string $resourceType, string $id, array $resource): array
    {
        return $this->put("/{$resourceType}/{$id}", $resource);
    }

    /**
     * Delete a resource
     */
    public function delete(string $resourceType, string $id): bool
    {
        $response = $this->request('DELETE', "/{$resourceType}/{$id}");
        return $response->successful();
    }

    /**
     * Execute a batch/transaction bundle
     */
    public function transaction(array $bundle): array
    {
        return $this->post('/', $bundle);
    }

    /**
     * Search across patient compartment
     */
    public function patientCompartment(string $patientId, string $resourceType, array $params = []): array
    {
        return $this->get("/Patient/{$patientId}/{$resourceType}", $params);
    }

    protected function get(string $endpoint, array $params = []): array
    {
        $response = $this->request('GET', $endpoint, ['query' => $params]);
        return $response->json();
    }

    protected function post(string $endpoint, array $data): array
    {
        $response = $this->request('POST', $endpoint, ['json' => $data]);
        return $response->json();
    }

    protected function put(string $endpoint, array $data): array
    {
        $response = $this->request('PUT', $endpoint, ['json' => $data]);
        return $response->json();
    }

    protected function request(string $method, string $endpoint, array $options = []): Response
    {
        $http = Http::withHeaders([
            'Accept' => 'application/fhir+json',
            'Content-Type' => 'application/fhir+json',
        ]);

        if ($this->accessToken) {
            $http = $http->withToken($this->accessToken);
        }

        $url = $this->baseUrl . $endpoint;

        return match(strtoupper($method)) {
            'GET' => $http->get($url, $options['query'] ?? []),
            'POST' => $http->post($url, $options['json'] ?? []),
            'PUT' => $http->put($url, $options['json'] ?? []),
            'PATCH' => $http->patch($url, $options['json'] ?? []),
            'DELETE' => $http->delete($url),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}")
        };
    }
}
```

### FHIR Export Service

```php
<?php
// app/Fhir/Services/FhirExportService.php

namespace App\Fhir\Services;

use App\Models\User;
use App\Models\Condition;
use App\Models\PatientCarePlan;
use App\Models\Goal;
use App\Models\Observation;
use Illuminate\Support\Str;

class FhirExportService
{
    /**
     * Export a complete care plan as a FHIR Bundle
     */
    public function exportCarePlanBundle(PatientCarePlan $carePlan): array
    {
        $entries = [];

        // Add Patient
        $entries[] = $this->bundleEntry(
            $this->patientToFhir($carePlan->patient),
            'Patient'
        );

        // Add Conditions
        foreach ($carePlan->conditions as $condition) {
            $entries[] = $this->bundleEntry(
                $this->conditionToFhir($condition, $carePlan->patient),
                'Condition'
            );
        }

        // Add Goals
        foreach ($carePlan->goals as $goal) {
            $entries[] = $this->bundleEntry(
                $this->goalToFhir($goal),
                'Goal'
            );
        }

        // Add CarePlan
        $entries[] = $this->bundleEntry(
            $this->carePlanToFhir($carePlan),
            'CarePlan'
        );

        // Add recent Observations
        $observations = $carePlan->patient->observations()
            ->where('effective_datetime', '>=', now()->subMonths(3))
            ->get();

        foreach ($observations as $observation) {
            $entries[] = $this->bundleEntry(
                $this->observationToFhir($observation),
                'Observation'
            );
        }

        return [
            'resourceType' => 'Bundle',
            'id' => Str::uuid()->toString(),
            'type' => 'collection',
            'timestamp' => now()->toIso8601String(),
            'entry' => $entries,
        ];
    }

    /**
     * Convert User to FHIR Patient
     */
    public function patientToFhir(User $user): array
    {
        return [
            'resourceType' => 'Patient',
            'id' => $user->fhir_id ?? $user->uuid,
            'identifier' => array_filter([
                $user->mrn ? [
                    'system' => 'http://hospital.example.org/mrn',
                    'value' => $user->mrn,
                ] : null,
            ]),
            'active' => $user->is_active,
            'name' => [[
                'use' => 'official',
                'family' => $user->last_name,
                'given' => [$user->first_name],
            ]],
            'gender' => $user->gender ?? 'unknown',
            'birthDate' => $user->date_of_birth?->format('Y-m-d'),
            'telecom' => array_filter([
                $user->email ? [
                    'system' => 'email',
                    'value' => $user->email,
                ] : null,
                $user->phone ? [
                    'system' => 'phone',
                    'value' => $user->phone,
                ] : null,
            ]),
        ];
    }

    /**
     * Convert Condition to FHIR Condition
     */
    public function conditionToFhir(Condition $condition, User $patient): array
    {
        $coding = [];

        if ($condition->snomed_code) {
            $coding[] = [
                'system' => 'http://snomed.info/sct',
                'code' => $condition->snomed_code,
                'display' => $condition->name,
            ];
        }

        if ($condition->icd10_code) {
            $coding[] = [
                'system' => 'http://hl7.org/fhir/sid/icd-10-cm',
                'code' => $condition->icd10_code,
                'display' => $condition->name,
            ];
        }

        return [
            'resourceType' => 'Condition',
            'id' => $condition->uuid ?? "condition-{$condition->id}",
            'clinicalStatus' => [
                'coding' => [[
                    'system' => 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    'code' => 'active',
                ]],
            ],
            'category' => [[
                'coding' => [[
                    'system' => 'http://terminology.hl7.org/CodeSystem/condition-category',
                    'code' => 'problem-list-item',
                    'display' => 'Problem List Item',
                ]],
            ]],
            'code' => [
                'coding' => $coding,
                'text' => $condition->name,
            ],
            'subject' => [
                'reference' => "Patient/{$patient->fhir_id}",
            ],
        ];
    }

    /**
     * Convert Goal to FHIR Goal
     */
    public function goalToFhir(Goal $goal): array
    {
        $resource = [
            'resourceType' => 'Goal',
            'id' => $goal->uuid,
            'lifecycleStatus' => $goal->lifecycle_status,
            'description' => [
                'text' => $goal->description,
            ],
            'subject' => [
                'reference' => "Patient/{$goal->patient->fhir_id}",
            ],
            'startDate' => $goal->start_date?->format('Y-m-d'),
        ];

        if ($goal->achievement_status) {
            $resource['achievementStatus'] = [
                'coding' => [[
                    'system' => 'http://terminology.hl7.org/CodeSystem/goal-achievement',
                    'code' => $goal->achievement_status,
                ]],
            ];
        }

        if ($goal->target_value && $goal->target_measure) {
            $resource['target'] = [[
                'measure' => [
                    'coding' => array_filter([
                        $goal->loinc_code ? [
                            'system' => 'http://loinc.org',
                            'code' => $goal->loinc_code,
                            'display' => $goal->target_measure,
                        ] : null,
                    ]),
                    'text' => $goal->target_measure,
                ],
                'detailQuantity' => [
                    'value' => $goal->target_value,
                    'unit' => $goal->target_unit,
                    'system' => 'http://unitsofmeasure.org',
                    'code' => $goal->target_unit,
                ],
                'dueDate' => $goal->target_date?->format('Y-m-d'),
            ]];
        }

        if ($goal->condition_id) {
            $resource['addresses'] = [[
                'reference' => "Condition/{$goal->condition->uuid}",
            ]];
        }

        return $resource;
    }

    /**
     * Convert Observation to FHIR Observation
     */
    public function observationToFhir(Observation $observation): array
    {
        $resource = [
            'resourceType' => 'Observation',
            'id' => $observation->uuid,
            'status' => $observation->status,
            'category' => [[
                'coding' => [[
                    'system' => 'http://terminology.hl7.org/CodeSystem/observation-category',
                    'code' => $observation->category,
                ]],
            ]],
            'code' => [
                'coding' => array_filter([
                    $observation->loinc_code ? [
                        'system' => 'http://loinc.org',
                        'code' => $observation->loinc_code,
                        'display' => $observation->type,
                    ] : null,
                ]),
                'text' => $observation->type,
            ],
            'subject' => [
                'reference' => "Patient/{$observation->patient->fhir_id}",
            ],
            'effectiveDateTime' => $observation->effective_datetime->toIso8601String(),
        ];

        // Handle different value types
        if ($observation->value_quantity !== null) {
            $resource['valueQuantity'] = [
                'value' => $observation->value_quantity,
                'unit' => $observation->value_unit,
                'system' => 'http://unitsofmeasure.org',
                'code' => $observation->value_unit,
            ];
        } elseif ($observation->value_string !== null) {
            $resource['valueString'] = $observation->value_string;
        } elseif ($observation->value_boolean !== null) {
            $resource['valueBoolean'] = $observation->value_boolean;
        }

        // Handle components (e.g., blood pressure)
        if ($observation->components) {
            $resource['component'] = collect($observation->components)->map(function ($comp) {
                return [
                    'code' => [
                        'coding' => [[
                            'system' => 'http://loinc.org',
                            'code' => $comp['loinc_code'] ?? '',
                            'display' => $comp['name'] ?? '',
                        ]],
                    ],
                    'valueQuantity' => [
                        'value' => $comp['value'],
                        'unit' => $comp['unit'],
                    ],
                ];
            })->toArray();
        }

        return $resource;
    }

    /**
     * Convert CarePlan to FHIR CarePlan
     */
    public function carePlanToFhir(PatientCarePlan $carePlan): array
    {
        return [
            'resourceType' => 'CarePlan',
            'id' => $carePlan->uuid,
            'status' => $carePlan->status,
            'intent' => $carePlan->intent,
            'title' => $carePlan->title,
            'description' => $carePlan->description,
            'subject' => [
                'reference' => "Patient/{$carePlan->patient->fhir_id}",
            ],
            'period' => [
                'start' => $carePlan->period_start?->format('Y-m-d'),
                'end' => $carePlan->period_end?->format('Y-m-d'),
            ],
            'author' => $carePlan->author ? [
                'reference' => "Practitioner/{$carePlan->author->fhir_id}",
            ] : null,
            'addresses' => $carePlan->conditions->map(fn($c) => [
                'reference' => "Condition/{$c->uuid}",
            ])->toArray(),
            'goal' => $carePlan->goals->map(fn($g) => [
                'reference' => "Goal/{$g->uuid}",
            ])->toArray(),
            'activity' => $carePlan->activities->map(fn($a) => [
                'detail' => [
                    'status' => $a->pivot->status ?? 'not-started',
                    'description' => $a->name,
                    'code' => [
                        'text' => $a->name,
                    ],
                ],
            ])->toArray(),
            'created' => $carePlan->created_at->toIso8601String(),
        ];
    }

    protected function bundleEntry(array $resource, string $resourceType): array
    {
        return [
            'fullUrl' => "urn:uuid:{$resource['id']}",
            'resource' => $resource,
        ];
    }
}
```

### FHIR API Routes

```php
<?php
// routes/api.php (add to existing file)

use App\Http\Controllers\Fhir\FhirCapabilityController;
use App\Http\Controllers\Fhir\FhirPatientController;
use App\Http\Controllers\Fhir\FhirConditionController;
use App\Http\Controllers\Fhir\FhirCarePlanController;
use App\Http\Controllers\Fhir\FhirGoalController;
use App\Http\Controllers\Fhir\FhirObservationController;

// FHIR R4 API endpoints
Route::prefix('fhir/r4')->group(function () {
    // Capability statement
    Route::get('metadata', [FhirCapabilityController::class, 'metadata']);

    // Patient resources
    Route::get('Patient', [FhirPatientController::class, 'search']);
    Route::get('Patient/{id}', [FhirPatientController::class, 'read']);
    Route::get('Patient/{id}/$everything', [FhirPatientController::class, 'everything']);

    // Condition resources
    Route::get('Condition', [FhirConditionController::class, 'search']);
    Route::get('Condition/{id}', [FhirConditionController::class, 'read']);

    // CarePlan resources
    Route::get('CarePlan', [FhirCarePlanController::class, 'search']);
    Route::get('CarePlan/{id}', [FhirCarePlanController::class, 'read']);
    Route::post('CarePlan', [FhirCarePlanController::class, 'create']);
    Route::put('CarePlan/{id}', [FhirCarePlanController::class, 'update']);

    // Goal resources
    Route::get('Goal', [FhirGoalController::class, 'search']);
    Route::get('Goal/{id}', [FhirGoalController::class, 'read']);
    Route::post('Goal', [FhirGoalController::class, 'create']);
    Route::put('Goal/{id}', [FhirGoalController::class, 'update']);

    // Observation resources
    Route::get('Observation', [FhirObservationController::class, 'search']);
    Route::get('Observation/{id}', [FhirObservationController::class, 'read']);
    Route::post('Observation', [FhirObservationController::class, 'create']);

    // Bundle operations
    Route::post('/', [FhirCapabilityController::class, 'transaction']);
});
```

---

## Part 6: Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- [ ] Create database migrations for new tables
- [ ] Create Eloquent models (Goal, Observation, PatientCarePlan)
- [ ] Add FHIR identifier columns to existing tables
- [ ] Set up `app/Fhir` directory structure

### Phase 2: Export Capability (Weeks 4-6)
- [ ] Implement FhirExportService with all transformers
- [ ] Create FHIR Bundle export for care plans
- [ ] Add "Export as FHIR" button to patient care plan UI
- [ ] Support JSON download of FHIR bundles

### Phase 3: FHIR API Endpoints (Weeks 7-9)
- [ ] Implement FhirCapabilityController (metadata)
- [ ] Implement read/search for all resources
- [ ] Add FHIR-compliant error responses (OperationOutcome)
- [ ] Add pagination support for search results

### Phase 4: Import Capability (Weeks 10-12)
- [ ] Implement FhirClient for external FHIR servers
- [ ] Create FhirImportService
- [ ] Build UI for importing patient data from EHR
- [ ] Handle data mapping and validation

### Phase 5: SMART on FHIR (Weeks 13-16)
- [ ] Implement OAuth 2.0 authorization flow
- [ ] Register as SMART app with EHR vendors
- [ ] Enable launch from EHR context
- [ ] Implement patient/practitioner scopes

### Phase 6: Wearables & Health Apps (Weeks 17-20)
- [ ] Apple HealthKit integration
- [ ] Google Fit integration
- [ ] Sync observations (weight, BP, activity)
- [ ] Background sync capabilities

---

## Part 7: Benefits Summary

| Benefit | Description |
|---------|-------------|
| **EHR Interoperability** | Exchange data with Epic, Cerner, Meditech, Allscripts |
| **Patient Data Portability** | Patients can export their care plans and share with any provider |
| **Wearable Integration** | Import vitals from Apple Watch, Fitbit, Garmin, Oura Ring |
| **Clinical Credibility** | FHIR compliance demonstrates healthcare-grade standards |
| **Research Ready** | Standardized data enables population health analytics |
| **Future-Proof** | FHIR is the mandated US healthcare interoperability standard |
| **Mobile App Support** | FHIR APIs enable mobile app development |

---

## Part 8: Standard Medical Codes

To maximize interoperability, add these standard codes to your data:

### LOINC Codes (Observations)
| Measurement | LOINC Code |
|-------------|------------|
| Body Weight | 29463-7 |
| Body Height | 8302-2 |
| BMI | 39156-5 |
| Blood Pressure Panel | 85354-9 |
| Systolic BP | 8480-6 |
| Diastolic BP | 8462-4 |
| Heart Rate | 8867-4 |
| HbA1c | 4548-4 |
| Fasting Glucose | 1558-6 |
| Total Cholesterol | 2093-3 |
| LDL Cholesterol | 2089-1 |
| HDL Cholesterol | 2085-9 |

### SNOMED CT Codes (Conditions)
| Condition | SNOMED Code |
|-----------|-------------|
| Type 2 Diabetes | 44054006 |
| Hypertension | 38341003 |
| Hyperlipidemia | 55822004 |
| Obesity | 414916001 |
| Coronary Artery Disease | 53741008 |
| Heart Failure | 84114007 |
| Depression | 35489007 |
| Anxiety | 197480006 |

### SNOMED CT Codes (Interventions)
| Intervention | SNOMED Code |
|--------------|-------------|
| Plant-based diet | 435581000124102 |
| Exercise therapy | 229065009 |
| Stress management | 226060000 |
| Sleep hygiene | 386522000 |
| Smoking cessation | 225323000 |
| Alcohol reduction | 408947002 |

---

## References

- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [FHIR RESTful API](https://build.fhir.org/http.html)
- [SMART on FHIR](https://docs.smarthealthit.org/)
- [US Core Implementation Guide](https://www.hl7.org/fhir/us/core/)
- [MCC Care Plan IG](https://build.fhir.org/ig/HL7/fhir-us-mcc/)
- [LOINC Codes](https://loinc.org/)
- [SNOMED CT Browser](https://browser.ihtsdotools.org/)
