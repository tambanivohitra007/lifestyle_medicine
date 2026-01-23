<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'care_domain_id' => $this->care_domain_id,
            'care_domain' => new CareDomainResource($this->whenLoaded('careDomain')),
            'name' => $this->name,
            'description' => $this->description,
            'mechanism' => $this->mechanism,
            'evidence_entries' => EvidenceEntryResource::collection($this->whenLoaded('evidenceEntries')),
            'tags' => ContentTagResource::collection($this->whenLoaded('tags')),
            'media' => MediaResource::collection($this->whenLoaded('media')),
            'pivot' => $this->when($this->pivot, [
                'strength_of_evidence' => $this->pivot?->strength_of_evidence,
                'recommendation_level' => $this->pivot?->recommendation_level,
                'clinical_notes' => $this->pivot?->clinical_notes,
                'order_index' => $this->pivot?->order_index,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
