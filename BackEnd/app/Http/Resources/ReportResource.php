<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reportable_type' => $this->reportable_type,
            'reportable_id' => $this->reportable_id,
            'reason' => $this->reason,
            'details' => $this->details,
            'status' => $this->status,
            'reporter' => $this->whenLoaded('reporter', fn () => [
                'id' => $this->reporter->id,
                'name' => $this->reporter->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
