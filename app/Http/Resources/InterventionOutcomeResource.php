<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionOutcomeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_id' => $this->intervention_id,
            'outcome_measure' => $this->outcome_measure,
            'expected_change' => $this->expected_change,
            'direction' => $this->direction,
            'timeline_weeks' => $this->timeline_weeks,
            'evidence_grade' => $this->evidence_grade,
            'measurement_method' => $this->measurement_method,
            'notes' => $this->notes,
            'order_index' => $this->order_index,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
