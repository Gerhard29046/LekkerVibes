<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'is_recurring' => $this->is_recurring,
            'is_beginner_friendly' => $this->is_beginner_friendly,
            'is_free' => $this->is_free,
            'price_cents' => $this->price_cents,
            'is_attend_alone_friendly' => $this->is_attend_alone_friendly,
            'transport_notes' => $this->transport_notes,
            'capacity' => $this->capacity,
            'status' => $this->status,
            'published_at' => $this->published_at,
            'cover_url' => $this->relationLoaded('coverMedia') ? $this->coverMedia?->url() : null,
            'organiser' => $this->whenLoaded('organiser', fn () => [
                'id' => $this->organiser->id,
                'name' => $this->organiser->name,
            ]),
            'community' => $this->whenLoaded('community', fn () => $this->community ? [
                'id' => $this->community->id,
                'name' => $this->community->name,
                'slug' => $this->community->slug,
            ] : null),
            'category' => new EventCategoryResource($this->whenLoaded('category')),
            'venue' => new VenueResource($this->whenLoaded('venue')),
            // Controller loads either just the nearest upcoming occurrence
            // (list views) or the full set (detail view) into this relation —
            // frontend treats occurrences[0] as "next up" either way.
            'occurrences' => EventOccurrenceResource::collection($this->whenLoaded('occurrences')),
            // Controller only eager-loads 'saves' (scoped to the current
            // user) when a Sanctum token was present on the request.
            'saved_by_me' => $this->when(
                $this->relationLoaded('saves'),
                fn () => $this->saves->isNotEmpty(),
                false
            ),
        ];
    }
}
