<?php

namespace App\Policies;

use App\Models\Community;
use App\Models\User;

class CommunityPolicy
{
    public function update(User $user, Community $community): bool
    {
        return $this->manages($user, $community);
    }

    public function delete(User $user, Community $community): bool
    {
        return $user->id === $community->creator_id || $user->is_admin;
    }

    public function manageMembers(User $user, Community $community): bool
    {
        return $this->manages($user, $community);
    }

    private function manages(User $user, Community $community): bool
    {
        if ($user->id === $community->creator_id || $user->is_admin) {
            return true;
        }

        return $community->members()
            ->where('user_id', $user->id)
            ->whereIn('role', ['organiser', 'moderator'])
            ->where('status', 'active')
            ->exists();
    }
}
