<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConditionComplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source_condition_id' => $this->source_condition_id,
            'source_condition' => new ConditionResource($this->whenLoaded('sourceCondition')),
            'complication_condition_id' => $this->complication_condition_id,
            'complication_condition' => new ConditionResource($this->whenLoaded('complicationCondition')),
            'name' => $this->name,
            'description' => $this->description,
            'likelihood' => $this->likelihood,
            'timeframe' => $this->timeframe,
            'preventable' => $this->preventable,
            'order_index' => $this->order_index,
            'has_linked_condition' => $this->hasLinkedCondition(),
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
