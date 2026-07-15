<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function delete(User $user, Message $message): bool
    {
        if ($user->id === $message->sender_id || $user->is_admin) {
            return true;
        }

        return $message->conversation->members()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->exists();
    }
}
