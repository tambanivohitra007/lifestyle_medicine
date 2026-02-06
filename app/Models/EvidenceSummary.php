<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvidenceSummary extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'condition_id',
        'intervention_id',
        'summary',
        'key_findings',
        'overall_quality',
        'recommendation_strength',
        'last_reviewed',
        'next_review_due',
        'reviewer_notes',
        'total_studies',
        'total_participants',
        'reviewed_by',
    ];

    protected $casts = [
        'last_reviewed' => 'date',
        'next_review_due' => 'date',
        'total_studies' => 'integer',
        'total_participants' => 'integer',
    ];

    /**
     * Get the condition this summary belongs to.
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Get the intervention this summary belongs to.
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the user who last reviewed this summary.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Scope to filter by quality grade.
     */
    public function scopeByQuality($query, string $quality)
    {
        return $query->where('overall_quality', $quality);
    }

    /**
     * Scope to get summaries needing review.
     */
    public function scopeNeedsReview($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('next_review_due')
              ->orWhere('next_review_due', '<=', now());
        });
    }

    /**
     * Check if this summary needs review.
     */
    public function needsReview(): bool
    {
        return is_null($this->next_review_due) || $this->next_review_due->isPast();
    }
}
