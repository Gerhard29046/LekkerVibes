<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'profile_visibility', 'show_location', 'show_age', 'show_joined_communities'])]
class PrivacySetting extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'show_location' => 'boolean',
            'show_age' => 'boolean',
            'show_joined_communities' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
