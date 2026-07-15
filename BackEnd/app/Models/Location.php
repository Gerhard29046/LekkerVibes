<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['type', 'name', 'slug', 'parent_id', 'province', 'latitude', 'longitude', 'is_popular'])]
class Location extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_popular' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function parent()
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Location::class, 'parent_id');
    }

    public function venues()
    {
        return $this->hasMany(Venue::class);
    }

    public function communities()
    {
        return $this->hasMany(Community::class);
    }

    public function userProfiles()
    {
        return $this->hasMany(UserProfile::class);
    }

    public function savedByUsers()
    {
        return $this->hasMany(UserSavedArea::class);
    }
}
