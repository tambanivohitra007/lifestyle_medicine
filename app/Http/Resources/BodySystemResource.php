<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BodySystemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'snomed_code' => $this->snomed_code,
            'description' => $this->description,
            'icon' => $this->icon,
            'color' => $this->color,
            'display_order' => $this->display_order,
            'categories' => ConditionCategoryResource::collection($this->whenLoaded('categories')),
            'conditions_count' => $this->when(
                $this->conditions_count !== null,
                $this->conditions_count
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
