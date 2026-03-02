<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContentRevision extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'revisionable_type',
        'revisionable_id',
        'version_number',
        'data',
        'change_summary',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'data' => 'array',
        'version_number' => 'integer',
        'created_at' => 'datetime',
    ];

    public function revisionable(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function getNextVersionNumber(string $type, string $id): int
    {
        $max = static::where('revisionable_type', $type)
            ->where('revisionable_id', $id)
            ->max('version_number');

        return ($max ?? 0) + 1;
    }
}
