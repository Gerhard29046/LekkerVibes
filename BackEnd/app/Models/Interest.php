<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'slug', 'icon', 'category'])]
class Interest extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [];
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'interest_user');
    }
}
