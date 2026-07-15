<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_id', 'frequency', 'interval', 'byweekday', 'starts_on', 'ends_on', 'start_time', 'duration_minutes'])]
class RecurringSchedule extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'byweekday' => 'array',
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
