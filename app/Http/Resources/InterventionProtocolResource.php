<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionProtocolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_id' => $this->intervention_id,
            'version' => $this->version,
            'duration_weeks' => $this->duration_weeks,
            'frequency_per_week' => $this->frequency_per_week,
            'intensity_level' => $this->intensity_level,
            'overview' => $this->overview,
            'prerequisites' => $this->prerequisites,
            'equipment_needed' => $this->equipment_needed,
            'steps' => ProtocolStepResource::collection($this->whenLoaded('steps')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
