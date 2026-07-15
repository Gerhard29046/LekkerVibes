<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

#[Fillable(['uploader_id', 'disk', 'path', 'original_filename', 'mime_type', 'size_bytes', 'width', 'height'])]
class Media extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [];
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }

    public function url(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
