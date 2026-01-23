<?php

namespace App\Imports;

use App\Models\Condition;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\Importable;

class ConditionsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError
{
    use Importable, SkipsErrors;

    protected int $rowsImported = 0;
    protected int $rowsSkipped = 0;

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

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'summary' => 'nullable|string',
        ];
    }

    public function getRowsImported(): int
    {
        return $this->rowsImported;
    }

    public function getRowsSkipped(): int
    {
        return $this->rowsSkipped;
    }
}
