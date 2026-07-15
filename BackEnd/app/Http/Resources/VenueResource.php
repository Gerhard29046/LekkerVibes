<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VenueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address_line' => $this->address_line,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'is_public_meeting_point' => $this->is_public_meeting_point,
            'notes' => $this->notes,
            'location' => new LocationResource($this->whenLoaded('location')),
        ];
    }
}
