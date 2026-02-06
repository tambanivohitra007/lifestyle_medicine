<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvidenceEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_id' => $this->intervention_id,
            'intervention' => new InterventionResource($this->whenLoaded('intervention')),
            'study_type' => $this->study_type,
            'population' => $this->population,
            'sample_size' => $this->sample_size,
            'quality_rating' => $this->quality_rating,
            'summary' => $this->summary,
            'notes' => $this->notes,
            'references' => ReferenceResource::collection($this->whenLoaded('references')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Audit information
            'created_by' => $this->when($this->relationLoaded('creator'), function () {
                return $this->creator ? [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                ] : null;
            }),
            'updated_by' => $this->when($this->relationLoaded('updater'), function () {
                return $this->updater ? [
                    'id' => $this->updater->id,
                    'name' => $this->updater->name,
                ] : null;
            }),
        ];
    }
}
