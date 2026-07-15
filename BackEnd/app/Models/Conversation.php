<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['type', 'community_id', 'event_id', 'title', 'created_by'])]
class Conversation extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [];
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->hasMany(ConversationMember::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function welcomeGroup()
    {
        return $this->hasOne(WelcomeGroup::class);
    }
}
