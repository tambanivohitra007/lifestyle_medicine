<?php

namespace App\Imports;

use App\Models\CareDomain;
use App\Models\Intervention;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\Importable;

class InterventionsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError
{
    use Importable, SkipsErrors;

    protected int $rowsImported = 0;
    protected int $rowsSkipped = 0;
    protected array $careDomainCache = [];

    public function model(array $row)
    {
        // Skip if intervention with same name already exists
        if (Intervention::where('name', $row['name'])->exists()) {
            $this->rowsSkipped++;
            return null;
        }

        // Find or create care domain
        $careDomainId = $this->getCareDomainId($row['care_domain'] ?? null);

        if (!$careDomainId) {
            $this->rowsSkipped++;
            return null;
        }

        $this->rowsImported++;

        return new Intervention([
            'care_domain_id' => $careDomainId,
            'name' => $row['name'],
            'description' => $row['description'] ?? null,
            'mechanism' => $row['mechanism'] ?? null,
        ]);
    }

    protected function getCareDomainId(?string $name): ?string
    {
        if (!$name) {
            return null;
        }

        // Check cache first
        if (isset($this->careDomainCache[$name])) {
            return $this->careDomainCache[$name];
        }

        // Find existing care domain
        $careDomain = CareDomain::where('name', $name)->first();

        if ($careDomain) {
            $this->careDomainCache[$name] = $careDomain->id;
            return $careDomain->id;
        }

        // Create new care domain
        $careDomain = CareDomain::create(['name' => $name]);
        $this->careDomainCache[$name] = $careDomain->id;

        return $careDomain->id;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'care_domain' => 'required|string|max:255',
            'description' => 'nullable|string',
            'mechanism' => 'nullable|string',
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
