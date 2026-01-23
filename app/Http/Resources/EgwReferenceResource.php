<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EgwReferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book' => $this->book,
            'book_abbreviation' => $this->book_abbreviation,
            'chapter' => $this->chapter,
            'page_start' => $this->page_start,
            'page_end' => $this->page_end,
            'paragraph' => $this->paragraph,
            'quote' => $this->quote,
            'topic' => $this->topic,
            'context' => $this->context,
            'citation' => $this->citation,
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
