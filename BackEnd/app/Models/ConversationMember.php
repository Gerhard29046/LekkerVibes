<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['conversation_id', 'user_id', 'role', 'is_muted', 'joined_at'])]
class ConversationMember extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_muted' => 'boolean',
            'joined_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
