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
            'snomed_code' => $this->snomed_code,
            'icd10_code' => $this->icd10_code,
            'body_system_id' => $this->body_system_id,
            'body_system' => $this->when($this->relationLoaded('bodySystem'), function () {
                return $this->bodySystem ? [
                    'id' => $this->bodySystem->id,
                    'name' => $this->bodySystem->name,
                    'slug' => $this->bodySystem->slug,
                    'icon' => $this->bodySystem->icon,
                    'color' => $this->bodySystem->color,
                ] : null;
            }),
            'sections' => ConditionSectionResource::collection($this->whenLoaded('sections')),
            'interventions' => InterventionResource::collection($this->whenLoaded('interventions')),
            'scriptures' => ScriptureResource::collection($this->whenLoaded('scriptures')),
            'recipes' => RecipeResource::collection($this->whenLoaded('recipes')),
            'effectiveness_ratings' => InterventionEffectivenessResource::collection($this->whenLoaded('effectivenessRatings')),
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
