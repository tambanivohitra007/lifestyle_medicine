<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a scientific or academic reference used to support evidence entries.
 *
 * References store bibliographic information for published studies, articles, and
 * other sources cited in evidence entries. They can include DOI, PubMed ID, and URL
 * for easy lookup and verification.
 *
 * @property string $id UUID primary key
 * @property string $citation The full bibliographic citation text
 * @property string|null $doi Digital Object Identifier for the publication
 * @property string|null $pmid PubMed identifier
 * @property string|null $url Direct URL to the publication
 * @property int|null $year Publication year
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EvidenceEntry> $evidenceEntries
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class Reference extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'citation',
        'doi',
        'pmid',
        'url',
        'year',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    /**
     * Get the evidence entries that cite this reference.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<EvidenceEntry, $this>
     */
    public function evidenceEntries(): BelongsToMany
    {
        return $this->belongsToMany(EvidenceEntry::class, 'evidence_reference')
            ->withPivot(['created_by', 'updated_by', 'deleted_by'])
            ->withTimestamps();
    }
}
