<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventOccurrenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'capacity' => $this->capacity,
            'spots_remaining' => $this->spots_remaining,
            'status' => $this->status,
            'venue' => new VenueResource($this->whenLoaded('venue')),
            'my_attendance_status' => $this->when(
                $request->user('sanctum') && $this->relationLoaded('attendees'),
                fn () => $this->attendees->firstWhere('user_id', $request->user('sanctum')?->id)?->status
            ),
        ];
    }
}
