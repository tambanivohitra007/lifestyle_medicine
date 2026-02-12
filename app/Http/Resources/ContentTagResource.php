<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentTagResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tag' => $this->tag,
            'interventions_count' => $this->whenCounted('interventions'),
            'recipes_count' => $this->whenCounted('recipes'),
            'scriptures_count' => $this->whenCounted('scriptures'),
            'egw_references_count' => $this->whenCounted('egwReferences'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
