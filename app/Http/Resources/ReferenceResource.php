<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'citation' => $this->citation,
            'doi' => $this->doi,
            'pmid' => $this->pmid,
            'url' => $this->url,
            'year' => $this->year,
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
