<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\ConditionsImport;
use App\Imports\InterventionsImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends Controller
{
    /**
     * Import conditions from CSV/Excel file.
     */
    public function importConditions(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240',
        ]);

        try {
            $import = new ConditionsImport;
            Excel::import($import, $request->file('file'));

            $errors = collect($import->errors())->map(function ($error) {
                return [
                    'row' => $error->row(),
                    'message' => $error->errors()[0] ?? 'Unknown error',
                ];
            })->toArray();

            return response()->json([
                'message' => 'Import completed',
                'imported' => $import->getRowsImported(),
                'skipped' => $import->getRowsSkipped(),
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            Log::error('Import failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json([
                'message' => 'Import failed. Please check the file format and try again.',
            ], 422);
        }
    }

    /**
     * Import interventions from CSV/Excel file.
     */
    public function importInterventions(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240',
        ]);

        try {
            $import = new InterventionsImport;
            Excel::import($import, $request->file('file'));

            $errors = collect($import->errors())->map(function ($error) {
                return [
                    'row' => $error->row(),
                    'message' => $error->errors()[0] ?? 'Unknown error',
                ];
            })->toArray();

            return response()->json([
                'message' => 'Import completed',
                'imported' => $import->getRowsImported(),
                'skipped' => $import->getRowsSkipped(),
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            Log::error('Import failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json([
                'message' => 'Import failed. Please check the file format and try again.',
            ], 422);
        }
    }

    /**
     * Get sample CSV templates for import.
     */
    public function getTemplates(): JsonResponse
    {
        return response()->json([
            'conditions' => [
                'headers' => ['name', 'category', 'summary'],
                'example' => [
                    ['Type 2 Diabetes', 'Metabolic', 'A chronic condition affecting blood sugar regulation'],
                    ['Hypertension', 'Cardiovascular', 'High blood pressure condition'],
                ],
            ],
            'interventions' => [
                'headers' => ['name', 'care_domain', 'description', 'mechanism'],
                'example' => [
                    ['Plant-Based Diet', 'Nutrition', 'A diet focusing on whole plant foods', 'Reduces inflammation and improves insulin sensitivity'],
                    ['HIIT Training', 'Exercise', 'High-intensity interval training', 'Improves cardiovascular fitness and metabolic health'],
                ],
            ],
        ]);
    }
}
