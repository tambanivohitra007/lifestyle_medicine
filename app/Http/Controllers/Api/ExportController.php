<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\EvidenceEntry;
use App\Models\Recipe;
use App\Models\Reference;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
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
            'scriptures',
            'recipes',
        ]);

        $pdf = Pdf::loadView('exports.condition', [
            'condition' => $condition,
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
}
