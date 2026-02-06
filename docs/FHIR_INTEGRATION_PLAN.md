# Knowledge Platform Enrichment Plan

## Executive Summary

This document outlines a plan to enrich the Lifestyle Medicine Knowledge Platform using **medical coding standards** and **structured content models**. The focus is on improving content quality, discoverability, and professional credibility—**without requiring EHR integration**.

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

### Enrichment Goals

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 KNOWLEDGE PLATFORM ENRICHMENT ROADMAP                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: Medical Code Standardization                                  │
│  ═════════════════════════════════════                                  │
│  1.1 Add SNOMED CT & ICD-10 codes to conditions                        │
│  1.2 Add SNOMED CT codes to interventions                              │
│  1.3 Add DOI/PubMed IDs to evidence                                    │
│                                                                         │
│  PHASE 2: Structured Intervention Protocols                             │
│  ══════════════════════════════════════════                             │
│  2.1 Protocol steps with timing/frequency                              │
│  2.2 Dosage/intensity levels                                           │
│  2.3 Contraindications and precautions                                 │
│  2.4 Expected outcomes with timelines                                  │
│                                                                         │
│  PHASE 3: Enhanced Evidence System                                      │
│  ═════════════════════════════════                                      │
│  3.1 GRADE evidence quality ratings                                    │
│  3.2 Direct PubMed/DOI linking                                         │
│  3.3 Study metadata (type, population, outcomes)                       │
│                                                                         │
│  PHASE 4: Knowledge Graph Enrichment                                    │
│  ════════════════════════════════════                                   │
│  4.1 Medical ontology hierarchies                                      │
│  4.2 Effectiveness ratings per condition                               │
│  4.3 Intervention synergy/conflict relationships                       │
│                                                                         │
│  PHASE 5: Export & API Capabilities                                     │
│  ══════════════════════════════════                                     │
│  5.1 PDF protocol exports for practitioners                            │
│  5.2 FHIR-format content export                                        │
│  5.3 Public API for content access                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Medical Code Standardization

### Why Medical Codes Matter

| Benefit | Description |
|---------|-------------|
| **Professional Credibility** | Healthcare providers recognize standard terminologies |
| **Improved Search** | Find related conditions using code hierarchies |
| **External Linking** | Connect to medical databases and resources |
| **Future-Proofing** | Ready for interoperability if ever needed |

### 1.1 Condition Codes (SNOMED CT & ICD-10)

#### Database Migration

```sql
-- Add medical codes to conditions table
ALTER TABLE conditions ADD COLUMN snomed_code VARCHAR(20) NULL;
ALTER TABLE conditions ADD COLUMN icd10_code VARCHAR(20) NULL;

-- Index for efficient lookups
CREATE INDEX idx_conditions_snomed ON conditions(snomed_code);
CREATE INDEX idx_conditions_icd10 ON conditions(icd10_code);
```

#### Common Lifestyle Medicine Condition Codes

| Condition | SNOMED CT | ICD-10 | Category |
|-----------|-----------|--------|----------|
| Type 2 Diabetes | 44054006 | E11 | Metabolic |
| Hypertension | 38341003 | I10 | Cardiovascular |
| Hyperlipidemia | 55822004 | E78 | Metabolic |
| Obesity | 414916001 | E66 | Metabolic |
| Coronary Artery Disease | 53741008 | I25 | Cardiovascular |
| Heart Failure | 84114007 | I50 | Cardiovascular |
| Depression | 35489007 | F32 | Mental Health |
| Anxiety Disorder | 197480006 | F41 | Mental Health |
| GERD | 235595009 | K21 | Gastrointestinal |
| Osteoarthritis | 396275006 | M15-M19 | Musculoskeletal |
| Sleep Apnea | 78275009 | G47.3 | Sleep |
| NAFLD | 197321007 | K76.0 | Hepatic |
| Chronic Fatigue | 52702003 | R53.82 | General |
| Fibromyalgia | 24693007 | M79.7 | Musculoskeletal |
| Metabolic Syndrome | 237602007 | E88.81 | Metabolic |

### 1.2 Intervention Codes (SNOMED CT)

#### Database Migration

```sql
-- Add SNOMED codes to interventions table
ALTER TABLE interventions ADD COLUMN snomed_code VARCHAR(20) NULL;

CREATE INDEX idx_interventions_snomed ON interventions(snomed_code);
```

#### Common Lifestyle Intervention Codes

| Intervention | SNOMED CT Code | Care Domain |
|--------------|----------------|-------------|
| Plant-based diet education | 435581000124102 | Nutrition |
| Mediterranean diet education | 1156606006 | Nutrition |
| Caloric restriction | 160670007 | Nutrition |
| Aerobic exercise therapy | 229065009 | Exercise |
| Resistance training | 229070002 | Exercise |
| Stress management | 226060000 | Stress |
| Mindfulness meditation | 711020003 | Stress |
| Sleep hygiene education | 386522000 | Rest |
| Cognitive behavioral therapy | 228557008 | Mental Health |
| Smoking cessation counseling | 225323000 | Toxin Avoidance |
| Alcohol reduction counseling | 408947002 | Toxin Avoidance |
| Weight management program | 170795002 | Nutrition |
| Social support therapy | 228557008 | Relationships |
| Hydrotherapy | 226234005 | Water |

### 1.3 Evidence Codes (DOI & PubMed)

#### Database Migration

```sql
-- Enhance evidence/references table
ALTER TABLE evidence ADD COLUMN doi VARCHAR(100) NULL;
ALTER TABLE evidence ADD COLUMN pubmed_id VARCHAR(20) NULL;
ALTER TABLE evidence ADD COLUMN study_type ENUM(
    'meta_analysis',
    'systematic_review',
    'rct',
    'cohort',
    'case_control',
    'cross_sectional',
    'case_series',
    'case_report',
    'expert_opinion'
) NULL;
ALTER TABLE evidence ADD COLUMN sample_size INT NULL;
ALTER TABLE evidence ADD COLUMN population_description TEXT NULL;

CREATE INDEX idx_evidence_doi ON evidence(doi);
CREATE INDEX idx_evidence_pubmed ON evidence(pubmed_id);
```

---

## Phase 2: Structured Intervention Protocols

### Why Structured Protocols Matter

Transform simple intervention descriptions into actionable, step-by-step protocols that practitioners can follow.

### 2.1 Protocol Schema

#### Database Migration

```sql
-- Create protocol steps table
CREATE TABLE intervention_protocols (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    intervention_id BIGINT UNSIGNED NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    duration_weeks INT NULL,
    frequency_per_week INT NULL,
    intensity_level ENUM('low', 'moderate', 'high', 'variable') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Protocol steps
CREATE TABLE protocol_steps (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    protocol_id BIGINT UNSIGNED NOT NULL,
    step_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    duration_minutes INT NULL,
    week_start INT DEFAULT 1,
    week_end INT NULL,
    notes TEXT NULL,
    FOREIGN KEY (protocol_id) REFERENCES intervention_protocols(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contraindications
CREATE TABLE intervention_contraindications (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    intervention_id BIGINT UNSIGNED NOT NULL,
    condition_id BIGINT UNSIGNED NULL,
    description TEXT NOT NULL,
    severity ENUM('absolute', 'relative', 'caution') NOT NULL,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Expected outcomes
CREATE TABLE intervention_outcomes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    intervention_id BIGINT UNSIGNED NOT NULL,
    outcome_measure VARCHAR(255) NOT NULL,
    expected_change VARCHAR(100) NULL,
    timeline_weeks INT NULL,
    evidence_grade ENUM('A', 'B', 'C', 'D') NULL,
    notes TEXT NULL,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.2 Example Protocol Structure

```json
{
  "intervention": "Plant-Based Diet Transition",
  "snomed_code": "435581000124102",
  "protocol": {
    "version": "1.0",
    "duration_weeks": 12,
    "phases": [
      {
        "name": "Foundation",
        "weeks": "1-4",
        "steps": [
          "Replace one meal per day with plant-based option",
          "Eliminate processed meats",
          "Increase vegetable intake to 5 servings/day"
        ]
      },
      {
        "name": "Expansion",
        "weeks": "5-8",
        "steps": [
          "Replace two meals per day with plant-based options",
          "Reduce dairy by 50%",
          "Add legumes 3x per week"
        ]
      },
      {
        "name": "Full Transition",
        "weeks": "9-12",
        "steps": [
          "Full plant-based eating pattern",
          "Master 10 core recipes",
          "Establish meal prep routine"
        ]
      }
    ],
    "contraindications": [
      {
        "condition": "B12 deficiency",
        "severity": "caution",
        "note": "Ensure B12 supplementation"
      }
    ],
    "expected_outcomes": [
      {
        "measure": "LDL Cholesterol",
        "change": "-20 to -30%",
        "timeline_weeks": 8,
        "evidence_grade": "A"
      },
      {
        "measure": "HbA1c",
        "change": "-0.5 to -1.0%",
        "timeline_weeks": 12,
        "evidence_grade": "A"
      }
    ]
  }
}
```

---

## Phase 3: Enhanced Evidence System

### 3.1 GRADE Evidence Quality

Implement the [GRADE system](https://www.gradeworkinggroup.org/) for rating evidence quality.

#### Evidence Quality Levels

| Grade | Quality | Description |
|-------|---------|-------------|
| A | High | Further research unlikely to change confidence |
| B | Moderate | Further research likely to impact confidence |
| C | Low | Further research very likely to change estimate |
| D | Very Low | Estimate is very uncertain |

#### Database Migration

```sql
-- Add GRADE rating to evidence
ALTER TABLE evidence ADD COLUMN grade_quality ENUM('A', 'B', 'C', 'D') NULL;
ALTER TABLE evidence ADD COLUMN grade_recommendation ENUM('strong', 'weak') NULL;

-- Evidence summaries for each condition-intervention pair
CREATE TABLE evidence_summaries (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    condition_id BIGINT UNSIGNED NOT NULL,
    intervention_id BIGINT UNSIGNED NOT NULL,
    summary TEXT NOT NULL,
    overall_grade ENUM('A', 'B', 'C', 'D') NOT NULL,
    recommendation_strength ENUM('strong', 'weak') NOT NULL,
    last_reviewed DATE NULL,
    reviewer_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pair (condition_id, intervention_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.2 Direct Citation Linking

```jsx
// Evidence display component with direct links
const EvidenceCard = ({ evidence }) => (
  <div className="border rounded-lg p-4">
    <h4 className="font-semibold">{evidence.title}</h4>
    <p className="text-gray-600 text-sm">{evidence.authors} ({evidence.year})</p>

    <div className="flex gap-2 mt-2">
      {evidence.doi && (
        <a
          href={`https://doi.org/${evidence.doi}`}
          target="_blank"
          className="text-blue-600 text-sm"
        >
          DOI ↗
        </a>
      )}
      {evidence.pubmed_id && (
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${evidence.pubmed_id}`}
          target="_blank"
          className="text-blue-600 text-sm"
        >
          PubMed ↗
        </a>
      )}
    </div>

    <div className="mt-2">
      <span className={`px-2 py-1 rounded text-xs ${getGradeColor(evidence.grade_quality)}`}>
        Grade {evidence.grade_quality}
      </span>
      <span className="text-xs text-gray-500 ml-2">
        {evidence.study_type} • n={evidence.sample_size}
      </span>
    </div>
  </div>
);
```

---

## Phase 4: Knowledge Graph Enrichment

### 4.1 Medical Ontology Hierarchies

Add body system and category hierarchies to improve navigation and discovery.

#### Database Migration

```sql
-- Body systems table
CREATE TABLE body_systems (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    snomed_code VARCHAR(20) NULL,
    description TEXT NULL,
    icon VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Link conditions to body systems
ALTER TABLE conditions ADD COLUMN body_system_id BIGINT UNSIGNED NULL;
ALTER TABLE conditions ADD FOREIGN KEY (body_system_id) REFERENCES body_systems(id);

-- Condition categories (more specific than body systems)
CREATE TABLE condition_categories (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    body_system_id BIGINT UNSIGNED NOT NULL,
    description TEXT NULL,
    FOREIGN KEY (body_system_id) REFERENCES body_systems(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE conditions ADD COLUMN category_id BIGINT UNSIGNED NULL;
ALTER TABLE conditions ADD FOREIGN KEY (category_id) REFERENCES condition_categories(id);

-- Insert common body systems
INSERT INTO body_systems (name, snomed_code, icon) VALUES
('Cardiovascular', '113257007', 'heart'),
('Metabolic/Endocrine', '113331007', 'activity'),
('Gastrointestinal', '122865005', 'utensils'),
('Musculoskeletal', '113192009', 'bone'),
('Neurological', '25087005', 'brain'),
('Mental Health', '74732009', 'smile'),
('Respiratory', '20139000', 'wind'),
('Immune/Inflammatory', '116003000', 'shield'),
('Integumentary', '48075008', 'sun');
```

### 4.2 Effectiveness Ratings

Track how effective each intervention is for each condition.

```sql
-- Effectiveness ratings for intervention-condition pairs
CREATE TABLE intervention_effectiveness (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    intervention_id BIGINT UNSIGNED NOT NULL,
    condition_id BIGINT UNSIGNED NOT NULL,
    effectiveness_rating ENUM('very_high', 'high', 'moderate', 'low', 'uncertain') NOT NULL,
    evidence_grade ENUM('A', 'B', 'C', 'D') NOT NULL,
    primary_intervention BOOLEAN DEFAULT FALSE,
    notes TEXT NULL,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pair (intervention_id, condition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.3 Intervention Relationships

Track synergies and conflicts between interventions.

```sql
-- Intervention relationships
CREATE TABLE intervention_relationships (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    intervention_a_id BIGINT UNSIGNED NOT NULL,
    intervention_b_id BIGINT UNSIGNED NOT NULL,
    relationship_type ENUM('synergy', 'complementary', 'neutral', 'caution', 'conflict') NOT NULL,
    description TEXT NULL,
    FOREIGN KEY (intervention_a_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_b_id) REFERENCES interventions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example: Exercise + Plant-based diet = synergy for cardiovascular health
```

---

## Phase 5: Export & API Capabilities

### 5.1 PDF Protocol Export

Generate professional PDF exports for practitioners.

```php
// app/Services/ProtocolPdfService.php
class ProtocolPdfService
{
    public function generateConditionProtocol(Condition $condition): string
    {
        $pdf = new Pdf();

        // Header
        $pdf->addSection('Lifestyle Medicine Protocol');
        $pdf->addTitle($condition->name);
        $pdf->addCodes($condition->snomed_code, $condition->icd10_code);

        // Summary
        $pdf->addSection('Overview');
        $pdf->addText($condition->summary);

        // Interventions by Care Domain
        foreach ($condition->interventionsByDomain() as $domain => $interventions) {
            $pdf->addSection($domain);
            foreach ($interventions as $intervention) {
                $pdf->addIntervention($intervention);
                if ($intervention->protocol) {
                    $pdf->addProtocolSteps($intervention->protocol);
                }
            }
        }

        // Evidence Summary
        $pdf->addSection('Evidence Summary');
        foreach ($condition->evidenceSummaries as $summary) {
            $pdf->addEvidenceSummary($summary);
        }

        // References
        $pdf->addSection('References');
        $pdf->addReferences($condition->references);

        return $pdf->output();
    }
}
```

### 5.2 FHIR-Format Export

Export content in FHIR format for interoperability.

```php
// app/Http/Controllers/Api/ExportController.php
class ExportController extends Controller
{
    public function exportConditionAsFhir(Condition $condition)
    {
        $condition->load(['interventions.careDomain', 'sections', 'evidence']);

        $resource = [
            'resourceType' => 'PlanDefinition',
            'id' => $condition->slug,
            'url' => url("/api/export/fhir/PlanDefinition/{$condition->slug}"),
            'version' => '1.0.0',
            'name' => str_replace(' ', '', $condition->name),
            'title' => $condition->name,
            'status' => 'active',
            'description' => $condition->summary,
            'date' => $condition->updated_at->toIso8601String(),
            'publisher' => config('app.name'),

            'subjectCodeableConcept' => [
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

            'action' => $this->mapInterventionsToActions($condition),
        ];

        return response()->json($resource)
            ->header('Content-Type', 'application/fhir+json');
    }
}
```

### 5.3 Public API

Provide read-only API access for third-party integrations.

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    // Public endpoints (rate-limited)
    Route::middleware('throttle:60,1')->group(function () {
        // Conditions
        Route::get('conditions', [PublicApiController::class, 'listConditions']);
        Route::get('conditions/{slug}', [PublicApiController::class, 'getCondition']);
        Route::get('conditions/{slug}/interventions', [PublicApiController::class, 'getConditionInterventions']);

        // Interventions
        Route::get('interventions', [PublicApiController::class, 'listInterventions']);
        Route::get('interventions/{slug}', [PublicApiController::class, 'getIntervention']);
        Route::get('interventions/{slug}/protocol', [PublicApiController::class, 'getInterventionProtocol']);

        // Search
        Route::get('search', [PublicApiController::class, 'search']);
        Route::get('search/by-code', [PublicApiController::class, 'searchByCode']);

        // Exports
        Route::get('export/condition/{slug}/pdf', [ExportController::class, 'conditionPdf']);
        Route::get('export/condition/{slug}/fhir', [ExportController::class, 'conditionFhir']);
    });
});
```

---

## Implementation Roadmap

### Phase 1: Medical Code Standardization (Current Focus)

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Add SNOMED/ICD-10 fields to conditions table | ✅ Complete |
| 1.2 | Add SNOMED field to interventions table | ✅ Complete |
| 1.3 | Update condition form with code fields | ✅ Complete |
| 1.4 | Update intervention form with code field | ✅ Complete |
| 1.5 | Add DOI/PubMed fields to evidence | ✅ Complete |
| 1.6 | Create SNOMED code lookup helper | ✅ Complete (external links) |

### Phase 2: Structured Protocols

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | Create protocol tables schema | Pending |
| 2.2 | Build protocol editor UI | Pending |
| 2.3 | Add contraindications management | Pending |
| 2.4 | Add expected outcomes tracking | Pending |

### Phase 3: Enhanced Evidence

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Add GRADE quality fields | Pending |
| 3.2 | Create evidence summary table | Pending |
| 3.3 | Build evidence grading UI | Pending |
| 3.4 | Implement citation auto-linking | Pending |

### Phase 4: Knowledge Graph

| Task | Description | Status |
|------|-------------|--------|
| 4.1 | Create body systems hierarchy | Pending |
| 4.2 | Add effectiveness ratings | Pending |
| 4.3 | Implement intervention relationships | Pending |
| 4.4 | Update knowledge graph visualization | Pending |

### Phase 5: Export & API

| Task | Description | Status |
|------|-------------|--------|
| 5.1 | Implement PDF export service | Pending |
| 5.2 | Create FHIR export endpoints | Pending |
| 5.3 | Build public API with rate limiting | Pending |
| 5.4 | Add API documentation | Pending |

---

## Benefits Summary

| Feature | Benefit |
|---------|---------|
| **Medical Codes** | Professional credibility, better search, external linking |
| **Structured Protocols** | Actionable guidance for practitioners |
| **Evidence Grading** | Clear indication of scientific backing |
| **Knowledge Graph** | Discover relationships and patterns |
| **Export Capabilities** | Share content with other systems |
| **Public API** | Enable third-party integrations |

---

## References

- [SNOMED CT Browser](https://browser.ihtsdotools.org/)
- [ICD-10 Codes](https://www.icd10data.com/)
- [LOINC Codes](https://loinc.org/)
- [GRADE Working Group](https://www.gradeworkinggroup.org/)
- [PubMed](https://pubmed.ncbi.nlm.nih.gov/)
- [DOI Foundation](https://www.doi.org/)
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)

---

## Future Considerations

### Patient Portal (If Needed Later)
If the platform evolves to include patient-facing features:
- Patient registration and authentication
- Personal care plan tracking
- Goal setting and progress monitoring
- FHIR-compliant patient data export

### EHR Integration (If Needed Later)
If clinical integration becomes necessary:
- SMART on FHIR authentication
- Import patient data from EHRs
- Export care plans to EHRs
- Wearables integration
