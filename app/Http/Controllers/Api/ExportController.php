<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Condition;
use App\Models\Recipe;
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
}
