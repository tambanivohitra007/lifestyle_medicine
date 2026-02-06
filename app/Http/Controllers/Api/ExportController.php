<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\EvidenceEntry;
use App\Models\Intervention;
use App\Models\Recipe;
use App\Models\Reference;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Export a condition with its interventions as PDF.
     */
    public function conditionPdf(Condition $condition): Response
    {
        $condition->load([
            'sections',
            'interventions.careDomain',
            'interventions.evidenceEntries.references',
            'interventions.protocol.steps',
            'interventions.contraindications',
            'interventions.outcomes',
            'scriptures',
            'recipes',
            'infographics', // Load infographics (media where type='infographic')
            'bodySystem',
            'effectivenessRatings.intervention',
            'evidenceSummaries',
        ]);

        // Organize infographics by type for easy access in template
        $infographicsByType = $condition->infographics->keyBy(function ($media) {
            // Extract type from alt_text (e.g., "Overview infographic" -> "overview")
            $altText = strtolower($media->alt_text ?? '');
            if (str_contains($altText, 'overview')) {
                return 'overview';
            }
            if (str_contains($altText, 'risk factor')) {
                return 'risk_factors';
            }
            if (str_contains($altText, 'lifestyle solution')) {
                return 'lifestyle_solutions';
            }
            return 'other';
        });

        // Build effectiveness lookup by intervention ID
        $effectivenessLookup = $condition->effectivenessRatings
            ->keyBy('intervention_id');

        $pdf = Pdf::loadView('exports.condition', [
            'condition' => $condition,
            'infographicsByType' => $infographicsByType,
            'effectivenessLookup' => $effectivenessLookup,
        ]);

        $filename = str_replace(' ', '_', strtolower($condition->name)) . '_guide.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export all conditions summary as PDF.
     */
    public function conditionsSummaryPdf(): Response
    {
        $conditions = Condition::with(['interventions'])
            ->orderBy('name')
            ->get();

        $pdf = Pdf::loadView('exports.conditions-summary', [
            'conditions' => $conditions,
        ]);

        return $pdf->download('conditions_summary.pdf');
    }

    /**
     * Export a recipe as a formatted PDF recipe card.
     */
    public function recipePdf(Recipe $recipe): Response
    {
        $recipe->load([
            'conditions',
            'interventions.careDomain',
            'tags',
        ]);

        $pdf = Pdf::loadView('exports.recipe', [
            'recipe' => $recipe,
        ]);

        $filename = str_replace(' ', '_', strtolower($recipe->title)) . '_recipe.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export all evidence entries as CSV.
     */
    public function evidenceCsv(): StreamedResponse
    {
        $filename = 'evidence_entries_' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');

            // CSV Header
            fputcsv($handle, [
                'ID',
                'Study Type',
                'Quality Rating',
                'Population',
                'Summary',
                'Notes',
                'Intervention',
                'Intervention Care Domain',
                'References Count',
                'Created At',
                'Updated At',
            ]);

            // Stream data in chunks to handle large datasets
            EvidenceEntry::with(['intervention.careDomain', 'references'])
                ->orderBy('created_at', 'desc')
                ->chunk(100, function ($entries) use ($handle) {
                    foreach ($entries as $entry) {
                        fputcsv($handle, [
                            $entry->id,
                            $this->formatStudyType($entry->study_type),
                            $entry->quality_rating,
                            $entry->population,
                            $this->cleanForCsv($entry->summary),
                            $this->cleanForCsv($entry->notes),
                            $entry->intervention?->name ?? '',
                            $entry->intervention?->careDomain?->name ?? '',
                            $entry->references->count(),
                            $entry->created_at?->format('Y-m-d H:i:s'),
                            $entry->updated_at?->format('Y-m-d H:i:s'),
                        ]);
                    }
                });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export all references as CSV.
     */
    public function referencesCsv(): StreamedResponse
    {
        $filename = 'references_' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');

            // CSV Header
            fputcsv($handle, [
                'ID',
                'Citation',
                'Year',
                'DOI',
                'PMID',
                'URL',
                'Evidence Entries Count',
                'Created At',
                'Updated At',
            ]);

            // Stream data in chunks
            Reference::withCount('evidenceEntries')
                ->orderBy('year', 'desc')
                ->orderBy('citation', 'asc')
                ->chunk(100, function ($references) use ($handle) {
                    foreach ($references as $reference) {
                        fputcsv($handle, [
                            $reference->id,
                            $this->cleanForCsv($reference->citation),
                            $reference->year,
                            $reference->doi,
                            $reference->pmid,
                            $reference->url,
                            $reference->evidence_entries_count,
                            $reference->created_at?->format('Y-m-d H:i:s'),
                            $reference->updated_at?->format('Y-m-d H:i:s'),
                        ]);
                    }
                });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Format study type for display.
     */
    private function formatStudyType(?string $studyType): string
    {
        if (!$studyType) {
            return '';
        }

        return match ($studyType) {
            'rct' => 'RCT',
            'meta_analysis' => 'Meta-Analysis',
            'systematic_review' => 'Systematic Review',
            'observational' => 'Observational',
            'case_series' => 'Case Series',
            'expert_opinion' => 'Expert Opinion',
            default => ucwords(str_replace('_', ' ', $studyType)),
        };
    }

    /**
     * Clean text for CSV output.
     */
    private function cleanForCsv(?string $text): string
    {
        if (!$text) {
            return '';
        }

        // Strip HTML tags and normalize whitespace
        $text = strip_tags($text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    // ==================== FHIR EXPORT METHODS ====================

    /**
     * Export a condition as FHIR R4 PlanDefinition.
     */
    public function conditionFhir(Condition $condition): JsonResponse
    {
        $condition->load([
            'interventions.careDomain',
            'interventions.protocol.steps',
            'interventions.outcomes',
            'sections',
            'bodySystem',
            'effectivenessRatings',
        ]);

        $slug = Str::slug($condition->name);

        $resource = [
            'resourceType' => 'PlanDefinition',
            'id' => $slug,
            'meta' => [
                'versionId' => '1',
                'lastUpdated' => $condition->updated_at->toIso8601String(),
                'profile' => ['http://hl7.org/fhir/StructureDefinition/PlanDefinition'],
            ],
            'url' => url("/api/v1/export/fhir/PlanDefinition/{$slug}"),
            'identifier' => [
                [
                    'system' => url('/'),
                    'value' => $condition->id,
                ],
            ],
            'version' => '1.0.0',
            'name' => Str::studly($condition->name),
            'title' => $condition->name,
            'type' => [
                'coding' => [
                    [
                        'system' => 'http://terminology.hl7.org/CodeSystem/plan-definition-type',
                        'code' => 'clinical-protocol',
                        'display' => 'Clinical Protocol',
                    ],
                ],
            ],
            'status' => 'active',
            'experimental' => false,
            'date' => $condition->updated_at->toIso8601String(),
            'publisher' => config('app.name'),
            'description' => $condition->summary ? strip_tags($condition->summary) : null,
        ];

        // Add subject coding (SNOMED/ICD-10)
        $codings = [];
        if ($condition->snomed_code) {
            $codings[] = [
                'system' => 'http://snomed.info/sct',
                'code' => $condition->snomed_code,
                'display' => $condition->name,
            ];
        }
        if ($condition->icd10_code) {
            $codings[] = [
                'system' => 'http://hl7.org/fhir/sid/icd-10-cm',
                'code' => $condition->icd10_code,
                'display' => $condition->name,
            ];
        }
        if (!empty($codings)) {
            $resource['subjectCodeableConcept'] = ['coding' => $codings];
        }

        // Add goals from sections
        $goals = [];
        foreach ($condition->sections as $section) {
            if ($section->section_type === 'solutions') {
                $goals[] = [
                    'description' => [
                        'text' => strip_tags($section->title),
                    ],
                    'priority' => [
                        'coding' => [
                            [
                                'system' => 'http://terminology.hl7.org/CodeSystem/goal-priority',
                                'code' => 'high-priority',
                            ],
                        ],
                    ],
                ];
            }
        }
        if (!empty($goals)) {
            $resource['goal'] = $goals;
        }

        // Add actions from interventions
        $actions = [];
        foreach ($condition->interventions as $index => $intervention) {
            $action = [
                'id' => "action-{$index}",
                'title' => $intervention->name,
                'description' => $intervention->description ? strip_tags($intervention->description) : null,
            ];

            // Add SNOMED code if available
            if ($intervention->snomed_code) {
                $action['code'] = [
                    [
                        'coding' => [
                            [
                                'system' => 'http://snomed.info/sct',
                                'code' => $intervention->snomed_code,
                                'display' => $intervention->name,
                            ],
                        ],
                    ],
                ];
            }

            // Add care domain as category
            if ($intervention->careDomain) {
                $action['type'] = [
                    'coding' => [
                        [
                            'system' => url('/api/v1/care-domains'),
                            'code' => Str::slug($intervention->careDomain->name),
                            'display' => $intervention->careDomain->name,
                        ],
                    ],
                ];
            }

            // Add timing from protocol
            if ($intervention->protocol) {
                if ($intervention->protocol->duration_weeks) {
                    $action['timingDuration'] = [
                        'value' => $intervention->protocol->duration_weeks,
                        'unit' => 'wk',
                        'system' => 'http://unitsofmeasure.org',
                        'code' => 'wk',
                    ];
                }
                if ($intervention->protocol->frequency_per_week) {
                    $action['timingTiming'] = [
                        'repeat' => [
                            'frequency' => $intervention->protocol->frequency_per_week,
                            'period' => 1,
                            'periodUnit' => 'wk',
                        ],
                    ];
                }
            }

            // Add documentation (mechanism)
            if ($intervention->mechanism) {
                $action['documentation'] = [
                    [
                        'type' => 'documentation',
                        'display' => 'Mechanism of Action',
                        'document' => [
                            'contentType' => 'text/plain',
                            'data' => base64_encode($intervention->mechanism),
                        ],
                    ],
                ];
            }

            $actions[] = $action;
        }

        if (!empty($actions)) {
            $resource['action'] = $actions;
        }

        return response()->json($resource)
            ->header('Content-Type', 'application/fhir+json');
    }

    /**
     * Export an intervention as FHIR R4 ActivityDefinition.
     */
    public function interventionFhir(Intervention $intervention): JsonResponse
    {
        $intervention->load([
            'careDomain',
            'protocol.steps',
            'outcomes',
            'contraindications',
        ]);

        $slug = Str::slug($intervention->name);

        $resource = [
            'resourceType' => 'ActivityDefinition',
            'id' => $slug,
            'meta' => [
                'versionId' => '1',
                'lastUpdated' => $intervention->updated_at->toIso8601String(),
                'profile' => ['http://hl7.org/fhir/StructureDefinition/ActivityDefinition'],
            ],
            'url' => url("/api/v1/export/fhir/ActivityDefinition/{$slug}"),
            'identifier' => [
                [
                    'system' => url('/'),
                    'value' => $intervention->id,
                ],
            ],
            'version' => '1.0.0',
            'name' => Str::studly($intervention->name),
            'title' => $intervention->name,
            'status' => 'active',
            'experimental' => false,
            'date' => $intervention->updated_at->toIso8601String(),
            'publisher' => config('app.name'),
            'description' => $intervention->description ? strip_tags($intervention->description) : null,
        ];

        // Add SNOMED code
        if ($intervention->snomed_code) {
            $resource['code'] = [
                'coding' => [
                    [
                        'system' => 'http://snomed.info/sct',
                        'code' => $intervention->snomed_code,
                        'display' => $intervention->name,
                    ],
                ],
            ];
        }

        // Add care domain as topic
        if ($intervention->careDomain) {
            $resource['topic'] = [
                [
                    'coding' => [
                        [
                            'system' => url('/api/v1/care-domains'),
                            'code' => Str::slug($intervention->careDomain->name),
                            'display' => $intervention->careDomain->name,
                        ],
                    ],
                ],
            ];
        }

        // Add timing from protocol
        if ($intervention->protocol) {
            if ($intervention->protocol->duration_weeks) {
                $resource['timingDuration'] = [
                    'value' => $intervention->protocol->duration_weeks,
                    'unit' => 'wk',
                    'system' => 'http://unitsofmeasure.org',
                    'code' => 'wk',
                ];
            }
        }

        // Add dosage/intensity
        if ($intervention->protocol && $intervention->protocol->intensity_level) {
            $resource['dosage'] = [
                [
                    'text' => "Intensity: {$intervention->protocol->intensity_level}",
                ],
            ];
        }

        // Add expected outcomes as observation requirements
        $observationRequirements = [];
        foreach ($intervention->outcomes as $outcome) {
            $observationRequirements[] = [
                'display' => $outcome->outcome_measure .
                    ($outcome->expected_change ? " (Expected: {$outcome->expected_change})" : '') .
                    ($outcome->timeline_weeks ? " at {$outcome->timeline_weeks} weeks" : ''),
            ];
        }
        if (!empty($observationRequirements)) {
            $resource['observationResultRequirement'] = $observationRequirements;
        }

        return response()->json($resource)
            ->header('Content-Type', 'application/fhir+json');
    }

    /**
     * Export FHIR capability statement for the API.
     */
    public function fhirCapabilityStatement(): JsonResponse
    {
        $resource = [
            'resourceType' => 'CapabilityStatement',
            'id' => 'lifestyle-medicine-capability',
            'url' => url('/api/v1/export/fhir/metadata'),
            'version' => '1.0.0',
            'name' => 'LifestyleMedicineCapabilityStatement',
            'title' => 'Lifestyle Medicine Knowledge Platform FHIR Capability Statement',
            'status' => 'active',
            'experimental' => false,
            'date' => now()->toIso8601String(),
            'publisher' => config('app.name'),
            'kind' => 'instance',
            'software' => [
                'name' => config('app.name'),
                'version' => '1.0.0',
            ],
            'implementation' => [
                'description' => 'Lifestyle Medicine Knowledge Platform FHIR API',
                'url' => url('/api/v1'),
            ],
            'fhirVersion' => '4.0.1',
            'format' => ['application/fhir+json'],
            'rest' => [
                [
                    'mode' => 'server',
                    'documentation' => 'Read-only FHIR API for lifestyle medicine protocols and interventions',
                    'resource' => [
                        [
                            'type' => 'PlanDefinition',
                            'profile' => 'http://hl7.org/fhir/StructureDefinition/PlanDefinition',
                            'documentation' => 'Lifestyle medicine condition protocols',
                            'interaction' => [
                                ['code' => 'read'],
                                ['code' => 'search-type'],
                            ],
                            'searchParam' => [
                                [
                                    'name' => 'title',
                                    'type' => 'string',
                                    'documentation' => 'Search by condition name',
                                ],
                                [
                                    'name' => 'code',
                                    'type' => 'token',
                                    'documentation' => 'Search by SNOMED or ICD-10 code',
                                ],
                            ],
                        ],
                        [
                            'type' => 'ActivityDefinition',
                            'profile' => 'http://hl7.org/fhir/StructureDefinition/ActivityDefinition',
                            'documentation' => 'Lifestyle medicine interventions',
                            'interaction' => [
                                ['code' => 'read'],
                                ['code' => 'search-type'],
                            ],
                            'searchParam' => [
                                [
                                    'name' => 'title',
                                    'type' => 'string',
                                    'documentation' => 'Search by intervention name',
                                ],
                                [
                                    'name' => 'code',
                                    'type' => 'token',
                                    'documentation' => 'Search by SNOMED code',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        return response()->json($resource)
            ->header('Content-Type', 'application/fhir+json');
    }
}
