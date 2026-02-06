<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvidenceSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'condition_id' => $this->condition_id,
            'intervention_id' => $this->intervention_id,

            // Related entities (when loaded)
            'condition' => $this->when($this->relationLoaded('condition'), function () {
                return $this->condition ? [
                    'id' => $this->condition->id,
                    'name' => $this->condition->name,
                    'slug' => $this->condition->slug,
                ] : null;
            }),
            'intervention' => $this->when($this->relationLoaded('intervention'), function () {
                return $this->intervention ? [
                    'id' => $this->intervention->id,
                    'name' => $this->intervention->name,
                    'care_domain' => $this->intervention->careDomain?->name,
                ] : null;
            }),

            // Summary content
            'summary' => $this->summary,
            'key_findings' => $this->key_findings,

            // GRADE assessment
            'overall_quality' => $this->overall_quality,
            'recommendation_strength' => $this->recommendation_strength,

            // Review metadata
            'last_reviewed' => $this->last_reviewed?->format('Y-m-d'),
            'next_review_due' => $this->next_review_due?->format('Y-m-d'),
            'reviewer_notes' => $this->reviewer_notes,
            'needs_review' => $this->needsReview(),

            // Statistics
            'total_studies' => $this->total_studies,
            'total_participants' => $this->total_participants,

            // Reviewer info
            'reviewer' => $this->when($this->relationLoaded('reviewer'), function () {
                return $this->reviewer ? [
                    'id' => $this->reviewer->id,
                    'name' => $this->reviewer->name,
                ] : null;
            }),

            // Timestamps
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
