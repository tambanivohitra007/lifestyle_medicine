<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionEffectivenessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_id' => $this->intervention_id,
            'condition_id' => $this->condition_id,
            'effectiveness_rating' => $this->effectiveness_rating,
            'effectiveness_score' => $this->effectiveness_score,
            'evidence_grade' => $this->evidence_grade,
            'is_primary' => $this->is_primary,
            'notes' => $this->notes,
            'intervention' => $this->when($this->relationLoaded('intervention'), function () {
                return $this->intervention ? [
                    'id' => $this->intervention->id,
                    'name' => $this->intervention->name,
                    'care_domain' => $this->intervention->careDomain?->name,
                ] : null;
            }),
            'condition' => $this->when($this->relationLoaded('condition'), function () {
                return $this->condition ? [
                    'id' => $this->condition->id,
                    'name' => $this->condition->name,
                ] : null;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
