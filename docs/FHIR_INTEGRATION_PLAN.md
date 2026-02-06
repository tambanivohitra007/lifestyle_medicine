# FHIR Integration Plan for Lifestyle Medicine System

## Executive Summary

This document outlines a **phased approach** to integrating FHIR (Fast Healthcare Interoperability Resources) into the Lifestyle Medicine system. The plan is tailored to the **current state** of the system (a content management platform) and provides a roadmap toward **patient-facing features** and **EHR interoperability**.

### Current System State

The admin-dashboard is a **content management system** with:
- ✅ Conditions (with sections, risk factors, complications)
- ✅ Interventions (linked to care domains)
- ✅ Care Domains (Nutrition, Exercise, Rest, Stress, etc.)
- ✅ Recipes (with dietary tags)
- ✅ Scriptures & EGW References (spiritual wellness)
- ✅ Evidence & References (research backing)
- ✅ Knowledge Graph & Mindmap visualizations
- ✅ AI content generation
- ❌ No patient records/profiles yet
- ❌ No patient observations/vitals
- ❌ No patient care plans
- ❌ No EHR integration

### Recommended Approach

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FHIR INTEGRATION ROADMAP                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TRACK A: Content Standardization (Admin Dashboard)                     │
│  ════════════════════════════════════════════════                       │
│  A1. Add medical codes to existing content (SNOMED, ICD-10)            │
│  A2. FHIR export for conditions/interventions                          │
│  A3. Import FHIR resources from external sources                       │
│                                                                         │
│  TRACK B: Patient Portal (New Frontend)                                 │
│  ═══════════════════════════════════════                                │
│  B1. Patient registration and authentication                           │
│  B2. Patient care plans with goals                                     │
│  B3. Observations/vitals tracking                                      │
│  B4. FHIR-compliant patient data export                                │
│                                                                         │
│  TRACK C: EHR Integration                                               │
│  ════════════════════════                                               │
│  C1. SMART on FHIR authentication                                      │
│  C2. Import patient data from EHRs                                     │
│  C3. Export care plans to EHRs                                         │
│  C4. Wearables integration                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: FHIR Overview

### What is FHIR?

FHIR (Fast Healthcare Interoperability Resources) is the HL7 standard for exchanging healthcare data. It uses RESTful APIs and JSON/XML formats.

**References:**
- [FHIR Implementation Guide Registry](https://www.fhir.org/guides/registry/)
- [FHIR RESTful API](https://build.fhir.org/http.html)
- [US Core Implementation Guide](https://www.hl7.org/fhir/us/core/)

### Core FHIR Operations

| Operation | HTTP Method | Endpoint | Description |
|-----------|-------------|----------|-------------|
| Read | GET | `[base]/[type]/[id]` | Get a resource |
| Search | GET | `[base]/[type]?[params]` | Query resources |
| Create | POST | `[base]/[type]` | Create resource |
| Update | PUT | `[base]/[type]/[id]` | Replace resource |
| Delete | DELETE | `[base]/[type]/[id]` | Remove resource |
| Batch | POST | `[base]` | Multiple operations |

### Relevant FHIR Resources

| FHIR Resource | Purpose | Current System Mapping |
|---------------|---------|------------------------|
| **Condition** | Health conditions | `conditions` table ✅ |
| **PlanDefinition** | Treatment templates | `interventions` + `conditions` ✅ |
| **ActivityDefinition** | Intervention definitions | `interventions` table ✅ |
| **NutritionOrder** | Dietary plans | `recipes` table ✅ |
| **Patient** | Patient demographics | `users` (needs patient role) ❌ |
| **CarePlan** | Patient treatment plans | New table needed ❌ |
| **Goal** | Health objectives | New table needed ❌ |
| **Observation** | Vitals/labs | New table needed ❌ |

---

## Part 2: Track A - Content Standardization

### A1. Add Medical Codes to Existing Content

**Goal:** Make your content interoperable by adding standard medical terminologies.

#### Database Migrations

```sql
-- Add FHIR coding to conditions
ALTER TABLE conditions ADD COLUMN snomed_code VARCHAR(20) NULL;
ALTER TABLE conditions ADD COLUMN icd10_code VARCHAR(20) NULL;
ALTER TABLE conditions ADD COLUMN fhir_id VARCHAR(255) NULL;

-- Add FHIR coding to interventions
ALTER TABLE interventions ADD COLUMN snomed_code VARCHAR(20) NULL;
ALTER TABLE interventions ADD COLUMN loinc_code VARCHAR(20) NULL;

-- Add FHIR coding to recipes
ALTER TABLE recipes ADD COLUMN snomed_code VARCHAR(20) NULL;

-- Example: Common condition codes
-- Type 2 Diabetes: SNOMED 44054006, ICD-10 E11
-- Hypertension: SNOMED 38341003, ICD-10 I10
-- Obesity: SNOMED 414916001, ICD-10 E66
```

#### Admin Dashboard Updates

Add code fields to condition/intervention edit forms:

```jsx
// admin-dashboard/src/features/conditions/components/ConditionForm.jsx
// Add to form fields:
<div className="grid grid-cols-2 gap-4">
  <div>
    <label>SNOMED CT Code</label>
    <input
      type="text"
      name="snomed_code"
      placeholder="e.g., 44054006"
      value={form.snomed_code}
      onChange={handleChange}
    />
    <a href="https://browser.ihtsdotools.org/" target="_blank" className="text-xs text-blue-600">
      Look up SNOMED codes →
    </a>
  </div>
  <div>
    <label>ICD-10 Code</label>
    <input
      type="text"
      name="icd10_code"
      placeholder="e.g., E11"
      value={form.icd10_code}
      onChange={handleChange}
    />
  </div>
</div>
```

#### Standard Code Reference Tables

**SNOMED CT Codes for Common Conditions:**
| Condition | SNOMED Code | ICD-10 |
|-----------|-------------|--------|
| Type 2 Diabetes | 44054006 | E11 |
| Hypertension | 38341003 | I10 |
| Hyperlipidemia | 55822004 | E78 |
| Obesity | 414916001 | E66 |
| Coronary Artery Disease | 53741008 | I25 |
| Heart Failure | 84114007 | I50 |
| Depression | 35489007 | F32 |
| Anxiety | 197480006 | F41 |
| GERD | 235595009 | K21 |
| Osteoarthritis | 396275006 | M15-M19 |

**SNOMED CT Codes for Lifestyle Interventions:**
| Intervention | SNOMED Code |
|--------------|-------------|
| Plant-based diet | 435581000124102 |
| Exercise therapy | 229065009 |
| Stress management | 226060000 |
| Sleep hygiene education | 386522000 |
| Smoking cessation | 225323000 |
| Alcohol reduction | 408947002 |
| Weight reduction | 170795002 |
| Meditation | 711020003 |

---

### A2. FHIR Export for Content

**Goal:** Allow exporting conditions and interventions as FHIR resources for use by other systems.

#### Backend: FHIR Export Controller

```php
<?php
// app/Http/Controllers/Api/FhirExportController.php

namespace App\Http\Controllers\Api;

use App\Models\Condition;
use App\Models\Intervention;
use Illuminate\Http\Request;

class FhirExportController extends Controller
{
    /**
     * Export a condition as FHIR PlanDefinition
     */
    public function exportCondition(Condition $condition)
    {
        $condition->load(['interventions.careDomain', 'sections', 'recipes']);

        $resource = [
            'resourceType' => 'PlanDefinition',
            'id' => $condition->slug ?? "condition-{$condition->id}",
            'url' => url("/fhir/r4/PlanDefinition/{$condition->slug}"),
            'version' => '1.0.0',
            'name' => str_replace(' ', '', $condition->name),
            'title' => $condition->name,
            'status' => 'active',
            'description' => $condition->summary,
            'date' => $condition->updated_at->toIso8601String(),
            'publisher' => config('app.name'),

            // The condition this plan addresses
            'subject' => [
                'coding' => array_filter([
                    $condition->snomed_code ? [
                        'system' => 'http://snomed.info/sct',
                        'code' => $condition->snomed_code,
                        'display' => $condition->name,
                    ] : null,
                    $condition->icd10_code ? [
                        'system' => 'http://hl7.org/fhir/sid/icd-10-cm',
                        'code' => $condition->icd10_code,
                        'display' => $condition->name,
                    ] : null,
                ]),
            ],

            // Goals (from condition sections)
            'goal' => $this->extractGoals($condition),

            // Actions (interventions grouped by care domain)
            'action' => $this->extractActions($condition),
        ];

        return response()->json($resource)
            ->header('Content-Type', 'application/fhir+json');
    }

    /**
     * Export all conditions as a FHIR Bundle
     */
    public function exportAllConditions()
    {
        $conditions = Condition::with(['interventions.careDomain'])->get();

        $bundle = [
            'resourceType' => 'Bundle',
            'type' => 'collection',
            'timestamp' => now()->toIso8601String(),
            'total' => $conditions->count(),
            'entry' => $conditions->map(fn($c) => [
                'fullUrl' => url("/fhir/r4/PlanDefinition/{$c->slug}"),
                'resource' => $this->conditionToPlanDefinition($c),
            ])->toArray(),
        ];

        return response()->json($bundle)
            ->header('Content-Type', 'application/fhir+json');
    }

    protected function extractGoals(Condition $condition): array
    {
        $goals = [];

        // Extract goals from condition sections
        foreach ($condition->sections as $section) {
            if (in_array($section->type, ['goals', 'outcomes', 'objectives'])) {
                foreach ($section->items as $item) {
                    $goals[] = [
                        'description' => [
                            'text' => $item['title'] ?? $item['content'],
                        ],
                        'priority' => [
                            'coding' => [[
                                'system' => 'http://terminology.hl7.org/CodeSystem/goal-priority',
                                'code' => 'medium-priority',
                            ]],
                        ],
                    ];
                }
            }
        }

        return $goals;
    }

    protected function extractActions(Condition $condition): array
    {
        $actionsByDomain = $condition->interventions
            ->groupBy('careDomain.name');

        return $actionsByDomain->map(function ($interventions, $domainName) {
            return [
                'title' => $domainName,
                'description' => "Interventions for {$domainName}",
                'action' => $interventions->map(fn($i) => [
                    'title' => $i->name,
                    'description' => strip_tags($i->description),
                    'code' => array_filter([
                        $i->snomed_code ? [
                            'coding' => [[
                                'system' => 'http://snomed.info/sct',
                                'code' => $i->snomed_code,
                                'display' => $i->name,
                            ]],
                        ] : null,
                    ]),
                ])->values()->toArray(),
            ];
        })->values()->toArray();
    }
}
```

#### API Routes

```php
// routes/api.php
Route::prefix('fhir/r4')->group(function () {
    // Capability statement
    Route::get('metadata', [FhirExportController::class, 'metadata']);

    // Export conditions as PlanDefinitions
    Route::get('PlanDefinition', [FhirExportController::class, 'exportAllConditions']);
    Route::get('PlanDefinition/{condition:slug}', [FhirExportController::class, 'exportCondition']);

    // Export interventions as ActivityDefinitions
    Route::get('ActivityDefinition', [FhirExportController::class, 'exportAllInterventions']);
    Route::get('ActivityDefinition/{intervention:slug}', [FhirExportController::class, 'exportIntervention']);
});
```

#### Admin Dashboard: Export Button

```jsx
// admin-dashboard/src/features/conditions/components/ConditionDetail.jsx
// Add to action buttons:

const handleExportFhir = async () => {
  try {
    const response = await api.get(`/fhir/r4/PlanDefinition/${condition.slug}`);

    // Download as JSON file
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: 'application/fhir+json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${condition.slug}.fhir.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('FHIR export failed:', error);
  }
};

// In the UI:
<button
  onClick={handleExportFhir}
  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
>
  <Download className="w-4 h-4" />
  Export as FHIR
</button>
```

---

### A3. Import FHIR Resources

**Goal:** Import condition definitions from external FHIR sources.

```php
<?php
// app/Http/Controllers/Api/FhirImportController.php

namespace App\Http\Controllers\Api;

use App\Models\Condition;
use Illuminate\Http\Request;

class FhirImportController extends Controller
{
    public function importPlanDefinition(Request $request)
    {
        $request->validate([
            'resource' => 'required|array',
            'resource.resourceType' => 'required|in:PlanDefinition',
        ]);

        $resource = $request->input('resource');

        // Extract condition data from FHIR PlanDefinition
        $conditionData = [
            'name' => $resource['title'] ?? $resource['name'],
            'summary' => $resource['description'] ?? '',
            'snomed_code' => $this->extractCode($resource['subject'] ?? [], 'http://snomed.info/sct'),
            'icd10_code' => $this->extractCode($resource['subject'] ?? [], 'http://hl7.org/fhir/sid/icd-10-cm'),
        ];

        $condition = Condition::updateOrCreate(
            ['snomed_code' => $conditionData['snomed_code']],
            $conditionData
        );

        return response()->json([
            'message' => 'Condition imported successfully',
            'condition' => $condition,
        ], 201);
    }

    protected function extractCode(array $subject, string $system): ?string
    {
        foreach ($subject['coding'] ?? [] as $coding) {
            if (($coding['system'] ?? '') === $system) {
                return $coding['code'];
            }
        }
        return null;
    }
}
```

---

## Part 3: Track B - Patient Portal

### Overview

This track adds patient-facing features to enable personalized care plans.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PATIENT PORTAL ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │   Admin Dashboard  │         │   Patient Portal   │         │
│  │   (React - exists) │         │   (React - new)    │         │
│  └─────────┬──────────┘         └─────────┬──────────┘         │
│            │                              │                      │
│            └──────────┬───────────────────┘                      │
│                       │                                          │
│            ┌──────────▼──────────┐                              │
│            │   Laravel Backend   │                              │
│            │   (API endpoints)   │                              │
│            └──────────┬──────────┘                              │
│                       │                                          │
│            ┌──────────▼──────────┐                              │
│            │      Database       │                              │
│            │  - conditions ✓     │                              │
│            │  - interventions ✓  │                              │
│            │  - patients (new)   │                              │
│            │  - care_plans (new) │                              │
│            │  - goals (new)      │                              │
│            │  - observations(new)│                              │
│            └─────────────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### B1. Database Schema for Patients

```sql
-- Extend users table for patients
ALTER TABLE users ADD COLUMN user_type ENUM('admin', 'editor', 'viewer', 'patient', 'practitioner') DEFAULT 'viewer';
ALTER TABLE users ADD COLUMN date_of_birth DATE NULL;
ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other', 'unknown') NULL;
ALTER TABLE users ADD COLUMN mrn VARCHAR(100) NULL COMMENT 'Medical Record Number';
ALTER TABLE users ADD COLUMN fhir_id VARCHAR(255) NULL;

-- Patient Care Plans
CREATE TABLE patient_care_plans (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    practitioner_id BIGINT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('draft', 'active', 'on-hold', 'completed', 'cancelled') DEFAULT 'draft',
    period_start DATE NULL,
    period_end DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Link care plans to conditions
CREATE TABLE care_plan_conditions (
    care_plan_id BIGINT UNSIGNED NOT NULL,
    condition_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (care_plan_id, condition_id),
    FOREIGN KEY (care_plan_id) REFERENCES patient_care_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Patient Goals
CREATE TABLE patient_goals (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    care_plan_id BIGINT UNSIGNED NOT NULL,
    description TEXT NOT NULL,
    target_measure VARCHAR(255) NULL,
    target_value DECIMAL(10,2) NULL,
    target_unit VARCHAR(50) NULL,
    target_date DATE NULL,
    lifecycle_status ENUM('proposed', 'planned', 'accepted', 'active', 'completed', 'cancelled') DEFAULT 'proposed',
    achievement_status ENUM('in-progress', 'improving', 'worsening', 'achieved', 'not-achieved') NULL,
    loinc_code VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (care_plan_id) REFERENCES patient_care_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Patient Observations
CREATE TABLE patient_observations (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    goal_id BIGINT UNSIGNED NULL,
    category VARCHAR(50) NOT NULL,          -- vital-signs, laboratory, etc.
    type VARCHAR(100) NOT NULL,             -- weight, blood_pressure, a1c
    value_quantity DECIMAL(10,2) NULL,
    value_unit VARCHAR(50) NULL,
    components JSON NULL,                    -- For BP: {systolic: 120, diastolic: 80}
    effective_datetime DATETIME NOT NULL,
    loinc_code VARCHAR(20) NULL,
    source VARCHAR(255) NULL,               -- manual, apple_health, fitbit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES patient_goals(id) ON DELETE SET NULL,
    INDEX idx_patient_type_date (patient_id, type, effective_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### B2. Patient Portal Features

**New React Application: `patient-portal/`**

```
patient-portal/
├── src/
│   ├── features/
│   │   ├── auth/                    # Patient login/register
│   │   ├── dashboard/               # Patient home
│   │   ├── care-plans/              # View assigned care plans
│   │   ├── goals/                   # Track health goals
│   │   ├── observations/            # Log vitals/measurements
│   │   ├── conditions/              # Learn about conditions
│   │   ├── recipes/                 # Browse recipes
│   │   └── profile/                 # Patient profile
│   ├── components/
│   │   ├── VitalsChart.jsx          # Visualize observations
│   │   ├── GoalProgress.jsx         # Goal achievement tracker
│   │   └── CarePlanCard.jsx         # Care plan summary
│   └── services/
│       └── api.js                   # API client
```

### B3. FHIR Export for Patient Data

```php
<?php
// app/Fhir/Services/PatientFhirExportService.php

namespace App\Fhir\Services;

use App\Models\PatientCarePlan;
use Illuminate\Support\Str;

class PatientFhirExportService
{
    public function exportCarePlanBundle(PatientCarePlan $carePlan): array
    {
        $entries = [];

        // Patient
        $entries[] = $this->bundleEntry(
            $this->patientToFhir($carePlan->patient)
        );

        // Conditions
        foreach ($carePlan->conditions as $condition) {
            $entries[] = $this->bundleEntry(
                $this->conditionToFhir($condition, $carePlan->patient)
            );
        }

        // Goals
        foreach ($carePlan->goals as $goal) {
            $entries[] = $this->bundleEntry(
                $this->goalToFhir($goal)
            );
        }

        // Care Plan
        $entries[] = $this->bundleEntry(
            $this->carePlanToFhir($carePlan)
        );

        // Recent Observations
        $observations = $carePlan->patient->observations()
            ->where('effective_datetime', '>=', now()->subMonths(3))
            ->get();

        foreach ($observations as $observation) {
            $entries[] = $this->bundleEntry(
                $this->observationToFhir($observation)
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

    // ... (transformer methods from previous plan)
}
```

---

## Part 4: Track C - EHR Integration

### C1. SMART on FHIR

SMART on FHIR enables your app to:
1. Launch from within an EHR (Epic, Cerner)
2. Authenticate using the EHR's OAuth2 server
3. Access patient data with proper consent

**Implementation requires:**
- OAuth 2.0 client implementation
- SMART app registration with each EHR vendor
- Scope management (patient/*.read, launch/patient)

### C2. Wearables Integration

Connect patient devices to auto-sync observations:

| Platform | Data Available | Integration Method |
|----------|----------------|-------------------|
| Apple Health | Steps, HR, Sleep, Weight | HealthKit API |
| Google Fit | Activity, Vitals | Google Fit REST API |
| Fitbit | Steps, HR, Sleep | Fitbit Web API |
| Oura Ring | Sleep, HRV, Readiness | Oura Cloud API |
| Garmin | Activity, HR, Stress | Garmin Connect API |

---

## Part 5: Implementation Roadmap

### Phase 1: Content Standardization (4-6 weeks)
**Admin Dashboard Focus**

| Week | Task | Deliverable |
|------|------|-------------|
| 1-2 | Add SNOMED/ICD-10 fields to database | Migrations |
| 2-3 | Update condition/intervention forms | UI fields |
| 3-4 | Implement FHIR export endpoints | API routes |
| 4-5 | Add export buttons to admin dashboard | Export feature |
| 5-6 | Testing and documentation | Complete Track A |

### Phase 2: Patient Portal Foundation (8-10 weeks)
**New Patient-Facing App**

| Week | Task | Deliverable |
|------|------|-------------|
| 1-2 | Database schema for patients/care plans | Migrations |
| 3-4 | Patient authentication (register/login) | Auth system |
| 5-6 | Care plan viewing and assignment | Care plan UI |
| 7-8 | Goal tracking with charts | Goals feature |
| 9-10 | Observation logging | Vitals tracking |

### Phase 3: FHIR Compliance (4-6 weeks)
**Standards Compliance**

| Week | Task | Deliverable |
|------|------|-------------|
| 1-2 | FHIR R4 endpoints for patient data | API routes |
| 3-4 | FHIR Bundle export for care plans | Export service |
| 5-6 | Capability statement and validation | FHIR compliance |

### Phase 4: EHR Integration (8-12 weeks)
**External System Connection**

| Week | Task | Deliverable |
|------|------|-------------|
| 1-4 | SMART on FHIR OAuth implementation | Auth flow |
| 5-8 | Epic/Cerner sandbox testing | EHR connection |
| 9-12 | Wearables integration | Device sync |

---

## Part 6: Benefits Summary

### For Admin Dashboard (Track A)

| Benefit | Description |
|---------|-------------|
| **Standardized Content** | Conditions mapped to SNOMED/ICD-10 codes |
| **Interoperability** | Export content as FHIR for other systems |
| **Data Quality** | Medical coding improves accuracy |
| **Research Ready** | Standardized data enables analytics |

### For Patient Portal (Track B)

| Benefit | Description |
|---------|-------------|
| **Personalized Care** | Patients get individualized care plans |
| **Progress Tracking** | Visualize health metrics over time |
| **Data Portability** | Export health data in FHIR format |
| **Engagement** | Goals and tracking increase adherence |

### For EHR Integration (Track C)

| Benefit | Description |
|---------|-------------|
| **Clinical Workflow** | Launch from EHR, access patient context |
| **Data Import** | Pull conditions, labs from EHR |
| **Care Coordination** | Share care plans with providers |
| **Wearable Sync** | Auto-import vitals from devices |

---

## Part 7: Quick Start - Track A

### Step 1: Add Migration

```bash
php artisan make:migration add_fhir_codes_to_conditions_table
```

```php
// database/migrations/xxxx_add_fhir_codes_to_conditions_table.php
public function up()
{
    Schema::table('conditions', function (Blueprint $table) {
        $table->string('snomed_code', 20)->nullable()->after('summary');
        $table->string('icd10_code', 20)->nullable()->after('snomed_code');
    });

    Schema::table('interventions', function (Blueprint $table) {
        $table->string('snomed_code', 20)->nullable()->after('description');
    });
}
```

### Step 2: Update API Resource

```php
// app/Http/Resources/ConditionResource.php
public function toArray($request)
{
    return [
        // ... existing fields
        'snomed_code' => $this->snomed_code,
        'icd10_code' => $this->icd10_code,
    ];
}
```

### Step 3: Update Admin Form

```jsx
// Add to ConditionForm.jsx
<div className="grid grid-cols-2 gap-4">
  <FormField
    label="SNOMED CT Code"
    name="snomed_code"
    value={form.snomed_code}
    onChange={handleChange}
    placeholder="e.g., 44054006"
    helpText={
      <a href="https://browser.ihtsdotools.org/" target="_blank" className="text-blue-600">
        Look up codes →
      </a>
    }
  />
  <FormField
    label="ICD-10 Code"
    name="icd10_code"
    value={form.icd10_code}
    onChange={handleChange}
    placeholder="e.g., E11"
  />
</div>
```

---

## References

- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [FHIR RESTful API](https://build.fhir.org/http.html)
- [US Core Implementation Guide](https://www.hl7.org/fhir/us/core/)
- [SMART on FHIR](https://docs.smarthealthit.org/)
- [SNOMED CT Browser](https://browser.ihtsdotools.org/)
- [LOINC Codes](https://loinc.org/)
- [ICD-10 Codes](https://www.icd10data.com/)
