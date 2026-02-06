<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConditionCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body_system_id' => $this->body_system_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'display_order' => $this->display_order,
            'body_system' => new BodySystemResource($this->whenLoaded('bodySystem')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
