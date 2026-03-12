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

/**
 * Excel/CSV import handler for lifestyle interventions.
 *
 * Imports intervention records from spreadsheet files using the Maatwebsite Excel package.
 * Expects a heading row with columns: name (required), care_domain (required),
 * description (optional), mechanism (optional).
 *
 * Deduplication: Skips rows where an intervention with the same name already exists.
 * Care domains: Automatically finds or creates care domain records by name, using an
 * in-memory cache to avoid redundant database queries for repeated domain names.
 * Error handling: Uses SkipsOnError to continue processing remaining rows on individual failures.
 *
 * @see \App\Models\Intervention The model created by this import
 * @see \App\Models\CareDomain The related care domain model
 * @see \App\Http\Controllers\Api\InterventionController::import() The controller endpoint that uses this
 */
class InterventionsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError
{
    use Importable, SkipsErrors;

    /** @var int Count of successfully imported rows */
    protected int $rowsImported = 0;

    /** @var int Count of skipped rows (duplicates or missing care domain) */
    protected int $rowsSkipped = 0;

    /** @var array<string, string> In-memory cache mapping care domain names to their UUIDs */
    protected array $careDomainCache = [];

    /**
     * Create an Intervention model from a spreadsheet row.
     *
     * Skips rows where an intervention with the same name already exists or
     * where the care domain name is missing/null. Resolves the care domain
     * by name, creating it if it does not exist.
     *
     * @param  array  $row  The spreadsheet row data with heading-based keys
     * @return Intervention|null The new Intervention model, or null if skipped
     */
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

    /**
     * Resolve a care domain name to its UUID, creating the domain if it does not exist.
     *
     * Uses an in-memory cache to avoid repeated database lookups for the same domain name
     * across multiple rows. Creates new CareDomain records automatically when a name is
     * encountered for the first time and does not exist in the database.
     *
     * @param  string|null  $name  The care domain name to resolve
     * @return string|null The care domain UUID, or null if name is null/empty
     */
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

    /**
     * Define validation rules for each spreadsheet row.
     *
     * @return array<string, string> Validation rules keyed by column heading
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'care_domain' => 'required|string|max:255',
            'description' => 'nullable|string',
            'mechanism' => 'nullable|string',
        ];
    }

    /**
     * Get the count of successfully imported rows.
     *
     * @return int Number of new interventions created
     */
    public function getRowsImported(): int
    {
        return $this->rowsImported;
    }

    /**
     * Get the count of skipped rows (duplicates or missing care domains).
     *
     * @return int Number of rows skipped
     */
    public function getRowsSkipped(): int
    {
        return $this->rowsSkipped;
    }
}
