<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProtocolStepResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocol_id' => $this->protocol_id,
            'step_number' => $this->step_number,
            'phase_name' => $this->phase_name,
            'title' => $this->title,
            'description' => $this->description,
            'duration_minutes' => $this->duration_minutes,
            'week_start' => $this->week_start,
            'week_end' => $this->week_end,
            'frequency' => $this->frequency,
            'instructions' => $this->instructions,
            'tips' => $this->tips,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
