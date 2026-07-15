<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SavedAreaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'radius_km' => $this->radius_km,
            'is_default' => $this->is_default,
            'location' => new LocationResource($this->whenLoaded('location')),
        ];
    }
}
