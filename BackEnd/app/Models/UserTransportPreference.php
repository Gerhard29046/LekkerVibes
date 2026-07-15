<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'has_car', 'uses_public_transport', 'uses_rideshare', 'walks_cycles', 'max_travel_minutes', 'notes'])]
class UserTransportPreference extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'has_car' => 'boolean',
            'uses_public_transport' => 'boolean',
            'uses_rideshare' => 'boolean',
            'walks_cycles' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
