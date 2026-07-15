<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'source_type', 'url', 'last_synced_at', 'is_active'])]
class ExternalEventSource extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'last_synced_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
