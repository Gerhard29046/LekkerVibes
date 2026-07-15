<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'user_id', 'display_name', 'username', 'bio', 'pronouns', 'age_range',
    'location_id', 'avatar_media_id', 'cover_media_id', 'alcohol_free_pref',
    'family_friendly_pref', 'is_verified', 'member_since',
])]
class UserProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'alcohol_free_pref' => 'boolean',
            'family_friendly_pref' => 'boolean',
            'is_verified' => 'boolean',
            'member_since' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function avatarMedia()
    {
        return $this->belongsTo(Media::class, 'avatar_media_id');
    }

    public function coverMedia()
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }
}
