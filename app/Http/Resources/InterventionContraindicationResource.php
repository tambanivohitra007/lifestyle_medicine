<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionContraindicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_id' => $this->intervention_id,
            'condition_id' => $this->condition_id,
            'condition' => $this->when($this->relationLoaded('condition'), function () {
                return $this->condition ? [
                    'id' => $this->condition->id,
                    'name' => $this->condition->name,
                ] : null;
            }),
            'title' => $this->title,
            'description' => $this->description,
            'severity' => $this->severity,
            'alternative_recommendation' => $this->alternative_recommendation,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
