<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_id', 'media_id', 'position'])]
class EventImage extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [];
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function media()
    {
        return $this->belongsTo(Media::class);
    }
}
