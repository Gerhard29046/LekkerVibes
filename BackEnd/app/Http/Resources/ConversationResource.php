<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'community' => $this->whenLoaded('community', fn () => $this->community ? [
                'id' => $this->community->id,
                'name' => $this->community->name,
            ] : null),
            'event' => $this->whenLoaded('event', fn () => $this->event ? [
                'id' => $this->event->id,
                'title' => $this->event->title,
            ] : null),
            'last_message' => $this->whenLoaded('messages', fn () => $this->messages->isNotEmpty()
                ? new MessageResource($this->messages->first())
                : null),
            'unread_count' => $this->when(isset($this->unread_count), fn () => (int) $this->unread_count),
            'my_role' => $this->whenLoaded('members', fn () => $this->members->first()?->role),
            'created_at' => $this->created_at,
        ];
    }
}
