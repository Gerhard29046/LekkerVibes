<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['community_id', 'media_id', 'position'])]
class CommunityImage extends Model
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

    public function media()
    {
        return $this->belongsTo(Media::class);
    }
}
