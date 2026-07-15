<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'email_enabled', 'push_enabled', 'event_reminders', 'community_updates', 'messages', 'marketing'])]
class NotificationPreference extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'email_enabled' => 'boolean',
            'push_enabled' => 'boolean',
            'event_reminders' => 'boolean',
            'community_updates' => 'boolean',
            'messages' => 'boolean',
            'marketing' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
