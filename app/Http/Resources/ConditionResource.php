<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConditionResource extends JsonResource
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
            'name' => $this->name,
            'category' => $this->category,
            'summary' => $this->summary,
            'sections' => ConditionSectionResource::collection($this->whenLoaded('sections')),
            'interventions' => InterventionResource::collection($this->whenLoaded('interventions')),
            'scriptures' => ScriptureResource::collection($this->whenLoaded('scriptures')),
            'recipes' => RecipeResource::collection($this->whenLoaded('recipes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
