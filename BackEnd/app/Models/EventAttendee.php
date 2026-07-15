<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_occurrence_id', 'user_id', 'status', 'joined_at'])]
class EventAttendee extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }

    public function occurrence()
    {
        return $this->belongsTo(EventOccurrence::class, 'event_occurrence_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
