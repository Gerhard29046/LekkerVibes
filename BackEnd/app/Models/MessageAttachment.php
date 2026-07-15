<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['message_id', 'media_id'])]
class MessageAttachment extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [];
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function media()
    {
        return $this->belongsTo(Media::class);
    }
}
