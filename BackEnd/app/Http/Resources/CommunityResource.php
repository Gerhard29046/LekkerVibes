<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'visibility' => $this->visibility,
            'join_policy' => $this->join_policy,
            'status' => $this->status,
            'member_count' => $this->member_count,
            'trending_score' => $this->trending_score,
            'cover_url' => $this->relationLoaded('coverMedia') ? $this->coverMedia?->url() : null,
            'logo_url' => $this->relationLoaded('logoMedia') ? $this->logoMedia?->url() : null,
            'location' => new LocationResource($this->whenLoaded('location')),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'rules' => $this->whenLoaded('rules', fn () => $this->rules->map(fn ($rule) => [
                'id' => $rule->id,
                'position' => $rule->position,
                'title' => $rule->title,
                'description' => $rule->description,
            ])),
            // Controller only eager-loads 'members' scoped to the current
            // user (see EventResource's 'saves' for the same pattern).
            'my_membership' => $this->when(
                $this->relationLoaded('members'),
                fn () => $this->members->isNotEmpty() ? [
                    'role' => $this->members->first()->role,
                    'status' => $this->members->first()->status,
                ] : null
            ),
        ];
    }
}
