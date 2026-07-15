<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['community_id', 'user_id', 'role', 'status', 'joined_at'])]
class CommunityMember extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
