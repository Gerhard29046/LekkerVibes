<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['community_id', 'key', 'label', 'can_manage_members', 'can_manage_events', 'can_post_announcements'])]
class CommunityRole extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'can_manage_members' => 'boolean',
            'can_manage_events' => 'boolean',
            'can_post_announcements' => 'boolean',
        ];
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }
}
