<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'creator_id', 'name', 'slug', 'description', 'location_id', 'cover_media_id',
    'logo_media_id', 'visibility', 'join_policy', 'status', 'member_count', 'trending_score',
])]
class Community extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'member_count' => 'integer',
            'trending_score' => 'float',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function coverMedia()
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function logoMedia()
    {
        return $this->belongsTo(Media::class, 'logo_media_id');
    }

    public function members()
    {
        return $this->hasMany(CommunityMember::class);
    }

    public function roles()
    {
        return $this->hasMany(CommunityRole::class);
    }

    public function rules()
    {
        return $this->hasMany(CommunityRule::class);
    }

    public function images()
    {
        return $this->hasMany(CommunityImage::class);
    }

    public function membershipRequests()
    {
        return $this->hasMany(MembershipRequest::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function crossPromotedEvents()
    {
        return $this->belongsToMany(Event::class, 'community_activities');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}
