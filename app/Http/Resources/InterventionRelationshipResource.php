<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionRelationshipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_a_id' => $this->intervention_a_id,
            'intervention_b_id' => $this->intervention_b_id,
            'relationship_type' => $this->relationship_type,
            'is_positive' => $this->isPositive(),
            'is_negative' => $this->isNegative(),
            'description' => $this->description,
            'clinical_notes' => $this->clinical_notes,
            'intervention_a' => $this->when($this->relationLoaded('interventionA'), function () {
                return $this->interventionA ? [
                    'id' => $this->interventionA->id,
                    'name' => $this->interventionA->name,
                    'care_domain' => $this->interventionA->careDomain?->name,
                ] : null;
            }),
            'intervention_b' => $this->when($this->relationLoaded('interventionB'), function () {
                return $this->interventionB ? [
                    'id' => $this->interventionB->id,
                    'name' => $this->interventionB->name,
                    'care_domain' => $this->interventionB->careDomain?->name,
                ] : null;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
