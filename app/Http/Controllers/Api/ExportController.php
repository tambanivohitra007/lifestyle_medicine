<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

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
}
