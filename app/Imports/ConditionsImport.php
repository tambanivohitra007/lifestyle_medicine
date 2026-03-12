<?php

namespace App\Imports;

use App\Models\Condition;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\Importable;

/**
 * Excel/CSV import handler for health conditions.
 *
 * Imports condition records from spreadsheet files using the Maatwebsite Excel package.
 * Expects a heading row with columns: name (required), category (optional), summary (optional).
 *
 * Deduplication: Skips rows where a condition with the same name already exists in the database.
 * Error handling: Uses SkipsOnError to continue processing remaining rows when individual rows fail.
 * Tracks import statistics (rows imported vs. skipped) for reporting.
 *
 * @see \App\Models\Condition The model created by this import
 * @see \App\Http\Controllers\Api\ConditionController::import() The controller endpoint that uses this
 */
class ConditionsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError
{
    use Importable, SkipsErrors;

    /** @var int Count of successfully imported rows */
    protected int $rowsImported = 0;

    /** @var int Count of skipped rows (duplicates or errors) */
    protected int $rowsSkipped = 0;

    /**
     * Create a Condition model from a spreadsheet row.
     *
     * Skips rows where a condition with the same name already exists.
     * Returns null for skipped rows (no database insert).
     *
     * @param  array  $row  The spreadsheet row data with heading-based keys
     * @return Condition|null The new Condition model, or null if skipped
     */
    public function model(array $row)
    {
        // Skip if condition with same name already exists
        if (Condition::where('name', $row['name'])->exists()) {
            $this->rowsSkipped++;
            return null;
        }

        $this->rowsImported++;

        return new Condition([
            'name' => $row['name'],
            'category' => $row['category'] ?? null,
            'summary' => $row['summary'] ?? null,
        ]);
    }

    /**
     * Define validation rules for each spreadsheet row.
     *
     * @return array<string, string> Validation rules keyed by column heading
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'summary' => 'nullable|string',
        ];
    }

    /**
     * Get the count of successfully imported rows.
     *
     * @return int Number of new conditions created
     */
    public function getRowsImported(): int
    {
        return $this->rowsImported;
    }

    /**
     * Get the count of skipped rows (duplicates).
     *
     * @return int Number of rows skipped due to existing conditions
     */
    public function getRowsSkipped(): int
    {
        return $this->rowsSkipped;
    }
}
