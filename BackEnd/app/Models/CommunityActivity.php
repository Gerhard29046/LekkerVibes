<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['community_id', 'event_id'])]
class CommunityActivity extends Model
{
    use HasFactory;

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
}
