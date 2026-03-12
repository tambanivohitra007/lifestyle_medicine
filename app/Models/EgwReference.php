<?php

namespace App\Models;

use App\Models\Traits\HasAuditFields;
use App\Models\Traits\HasPublishingStatus;
use App\Models\Traits\HasRevisions;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a reference from Ellen G. White's writings on health and spirituality.
 *
 * EGW references contain quotes and citations from books such as "Ministry of Healing",
 * "Counsels on Diet and Foods", and other health-related publications. They are linked
 * to conditions and interventions to provide Spirit of Prophecy guidance alongside
 * lifestyle medicine protocols.
 *
 * @property string $id UUID primary key
 * @property string $book The full book title
 * @property string|null $book_abbreviation Standard EGW book abbreviation (e.g., "MH", "CD")
 * @property string|null $chapter The chapter name or number
 * @property int|null $page_start Starting page number
 * @property int|null $page_end Ending page number
 * @property string|null $paragraph Paragraph identifier within the page
 * @property string|null $quote The quoted text from the reference
 * @property string|null $topic The health or spiritual topic addressed
 * @property string|null $context Additional context for the reference
 * @property string $status Publishing status (draft, in_review, published, archived)
 * @property int|null $created_by ID of the user who created this record
 * @property int|null $updated_by ID of the user who last updated this record
 * @property int|null $deleted_by ID of the user who deleted this record
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read string $citation Formatted citation string (accessor)
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Condition> $conditions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Intervention> $interventions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentTag> $tags
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContentRevision> $revisions
 * @property-read User|null $creator
 * @property-read User|null $updater
 * @property-read User|null $deleter
 */
class EgwReference extends Model
{
    use HasAuditFields, HasFactory, HasPublishingStatus, HasRevisions, HasUuids, SoftDeletes;

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
        'status',
    ];

    protected $casts = [
        'page_start' => 'integer',
        'page_end' => 'integer',
    ];

    /**
     * Get the formatted citation for this reference.
     * e.g., "Ministry of Healing, p. 127" or "MH 127.2"
     *
     * @return string
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
                    $pageRef .= '-'.$this->page_end;
                }
                if ($this->paragraph) {
                    $pageRef .= '.'.$this->paragraph;
                }
                $parts[] = $pageRef;
            } else {
                // Long format: p. 127 or pp. 127-130
                if ($this->page_end && $this->page_end !== $this->page_start) {
                    $parts[] = 'pp. '.$this->page_start.'-'.$this->page_end;
                } else {
                    $parts[] = 'p. '.$this->page_start;
                }
            }
        }

        return implode($this->book_abbreviation ? ' ' : ', ', $parts);
    }

    /**
     * Get the conditions linked to this EGW reference.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Condition, $this>
     */
    public function conditions(): BelongsToMany
    {
        return $this->belongsToMany(Condition::class, 'condition_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the interventions linked to this EGW reference.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Intervention, $this>
     */
    public function interventions(): BelongsToMany
    {
        return $this->belongsToMany(Intervention::class, 'intervention_egw_reference')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Get the content tags for this EGW reference.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<ContentTag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'egw_reference_tag')
            ->withPivot(['created_by', 'deleted_by'])
            ->withTimestamps();
    }

    /**
     * Common EGW book abbreviations for reference.
     *
     * @return array<string, string> Map of abbreviation to full book title
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
