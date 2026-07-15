<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['moderator_id', 'community_id', 'target_type', 'target_id', 'action', 'reason'])]
class ModerationAction extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [];
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function target()
    {
        return $this->morphTo();
    }
}
