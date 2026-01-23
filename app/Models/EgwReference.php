<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EgwReference extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditFields;

    protected $fillable = [
        'book',
        'book_abbreviation',
        'chapter',
        'page_start',
        'page_end',
        'paragraph',
        'quote',
        'topic',
        'context',
    ];

    protected $casts = [
        'page_start' => 'integer',
        'page_end' => 'integer',
    ];

    /**
     * Get the formatted citation for this reference.
     * e.g., "Ministry of Healing, p. 127" or "MH 127.2"
     */
    public function getCitationAttribute(): string
    {
        $parts = [];

        // Use abbreviation if available, otherwise full book name
        $bookName = $this->book_abbreviation ?: $this->book;
        $parts[] = $bookName;

        // Add chapter if present
        if ($this->chapter) {
            $parts[] = $this->chapter;
        }

        // Add page reference
        if ($this->page_start) {
            if ($this->book_abbreviation) {
                // Short format: MH 127 or MH 127-130
                $pageRef = $this->page_start;
                if ($this->page_end && $this->page_end !== $this->page_start) {
                    $pageRef .= '-' . $this->page_end;
                }
                if ($this->paragraph) {
                    $pageRef .= '.' . $this->paragraph;
                }
                $parts[] = $pageRef;
            } else {
                // Long format: p. 127 or pp. 127-130
                if ($this->page_end && $this->page_end !== $this->page_start) {
                    $parts[] = 'pp. ' . $this->page_start . '-' . $this->page_end;
                } else {
                    $parts[] = 'p. ' . $this->page_start;
                }
            }
        }

        return implode($this->book_abbreviation ? ' ' : ', ', $parts);
    }

    /**
     * Get the conditions linked to this EGW reference.
     */
    public function conditions(): BelongsToMany
    {
        return $this->belongsToMany(Condition::class, 'condition_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the interventions linked to this EGW reference.
     */
    public function interventions(): BelongsToMany
    {
        return $this->belongsToMany(Intervention::class, 'intervention_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the content tags for this EGW reference.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'egw_reference_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Common EGW book abbreviations for reference.
     */
    public static function getBookAbbreviations(): array
    {
        return [
            'MH' => 'Ministry of Healing',
            'CD' => 'Counsels on Diet and Foods',
            'CH' => 'Counsels on Health',
            'MM' => 'Medical Ministry',
            'Te' => 'Temperance',
            'HL' => 'Healthful Living',
            'CTBH' => 'Christian Temperance and Bible Hygiene',
            'Ed' => 'Education',
            'CG' => 'Child Guidance',
            'AH' => 'Adventist Home',
            'ML' => 'My Life Today',
            'HP' => 'In Heavenly Places',
            'SC' => 'Steps to Christ',
            'DA' => 'Desire of Ages',
            'GC' => 'Great Controversy',
            'PP' => 'Patriarchs and Prophets',
            'PK' => 'Prophets and Kings',
            'AA' => 'Acts of the Apostles',
            'COL' => 'Christ\'s Object Lessons',
            'MB' => 'Thoughts from the Mount of Blessing',
            '1T-9T' => 'Testimonies for the Church (volumes 1-9)',
            'EW' => 'Early Writings',
            'LS' => 'Life Sketches',
            'RH' => 'Review and Herald',
            'ST' => 'Signs of the Times',
        ];
    }
}
