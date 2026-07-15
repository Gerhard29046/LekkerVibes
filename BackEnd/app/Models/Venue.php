<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'location_id', 'address_line', 'latitude', 'longitude', 'is_public_meeting_point', 'notes'])]
class Venue extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'is_public_meeting_point' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function occurrences()
    {
        return $this->hasMany(EventOccurrence::class);
    }
}
