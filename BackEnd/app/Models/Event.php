<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'organiser_id', 'community_id', 'category_id', 'venue_id', 'cover_media_id',
    'title', 'slug', 'description', 'is_recurring', 'is_beginner_friendly', 'is_free',
    'price_cents', 'is_attend_alone_friendly', 'transport_notes', 'capacity', 'status',
    'published_at', 'trending_score',
])]
class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'is_recurring' => 'boolean',
            'is_beginner_friendly' => 'boolean',
            'is_free' => 'boolean',
            'is_attend_alone_friendly' => 'boolean',
            'published_at' => 'datetime',
            'trending_score' => 'float',
        ];
    }

    public function organiser()
    {
        return $this->belongsTo(User::class, 'organiser_id');
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function category()
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function coverMedia()
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function recurringSchedule()
    {
        return $this->hasOne(RecurringSchedule::class);
    }

    public function occurrences()
    {
        return $this->hasMany(EventOccurrence::class);
    }

    public function saves()
    {
        return $this->hasMany(EventSave::class);
    }

    public function images()
    {
        return $this->hasMany(EventImage::class);
    }

    public function crossPromotingCommunities()
    {
        return $this->belongsToMany(Community::class, 'community_activities');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}
