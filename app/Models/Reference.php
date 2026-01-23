<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
     */
    public function evidenceEntries(): BelongsToMany
    {
        return $this->belongsToMany(EvidenceEntry::class, 'evidence_reference')
            ->withPivot(['created_by', 'updated_by', 'deleted_by'])
            ->withTimestamps();
    }
}
