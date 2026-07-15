<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'slug', 'icon', 'color'])]
class EventCategory extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [];
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'category_id');
    }
}
