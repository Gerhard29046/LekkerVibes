<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_saved_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->unsignedInteger('radius_km')->default(15);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_saved_areas');
    }
};
