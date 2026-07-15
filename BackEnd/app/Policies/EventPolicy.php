<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function update(User $user, Event $event): bool
    {
        return $this->manages($user, $event);
    }

    public function delete(User $user, Event $event): bool
    {
        return $this->manages($user, $event);
    }

    private function manages(User $user, Event $event): bool
    {
        if ($user->id === $event->organiser_id || $user->is_admin) {
            return true;
        }

        if ($event->community_id === null) {
            return false;
        }

        return $user->communityMemberships()
            ->where('community_id', $event->community_id)
            ->whereIn('role', ['organiser', 'moderator'])
            ->where('status', 'active')
            ->exists();
    }
}
