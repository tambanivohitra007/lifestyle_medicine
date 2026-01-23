<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'dietary_tags' => $this->dietary_tags,
            'ingredients' => $this->ingredients,
            'instructions' => $this->instructions,
            'servings' => $this->servings,
            'prep_time_minutes' => $this->prep_time_minutes,
            'cook_time_minutes' => $this->cook_time_minutes,
            'tags' => ContentTagResource::collection($this->whenLoaded('tags')),
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
