<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API resource for transforming InterventionProtocol model instances.
 *
 * Includes protocol metadata (version, duration, frequency, intensity),
 * overview text, prerequisites, equipment, and nested protocol steps.
 */
class InterventionProtocolResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
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
