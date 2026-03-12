<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a summarized evidence assessment for a condition-intervention pair.
 *
 * Evidence summaries aggregate the overall evidence quality, key findings, and
 * recommendation strength for a specific condition-intervention combination. They
 * include review tracking with reviewer information, review dates, and study/participant
 * counts. Summaries are periodically reviewed and updated as new evidence emerges.
 *
 * @property string $id UUID primary key
 * @property string|null $condition_id Foreign key to the condition
 * @property string|null $intervention_id Foreign key to the intervention
 * @property string|null $summary Narrative summary of the evidence
 * @property string|null $key_findings Key findings from the evidence review
 * @property string|null $overall_quality Overall quality grade of the evidence
 * @property string|null $recommendation_strength Strength of the clinical recommendation
 * @property \Illuminate\Support\Carbon|null $last_reviewed Date the summary was last reviewed
 * @property \Illuminate\Support\Carbon|null $next_review_due Date the next review is due
 * @property string|null $reviewer_notes Notes from the reviewer
 * @property int|null $total_studies Total number of studies included
 * @property int|null $total_participants Total number of participants across studies
 * @property int|null $reviewed_by ID of the user who last reviewed this summary
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read Condition|null $condition
 * @property-read Intervention|null $intervention
 * @property-read User|null $reviewer
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Condition, $this>
     */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(Condition::class);
    }

    /**
     * Get the intervention this summary belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Intervention, $this>
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Get the user who last reviewed this summary.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Scope to filter by quality grade.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $quality The quality grade to filter by
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByQuality($query, string $quality)
    {
        return $query->where('overall_quality', $quality);
    }

    /**
     * Scope to get summaries needing review (past due or never reviewed).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeNeedsReview($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('next_review_due')
              ->orWhere('next_review_due', '<=', now());
        });
    }

    /**
     * Check if this summary needs review (past due or never reviewed).
     *
     * @return bool
     */
    public function needsReview(): bool
    {
        return is_null($this->next_review_due) || $this->next_review_due->isPast();
    }
}
