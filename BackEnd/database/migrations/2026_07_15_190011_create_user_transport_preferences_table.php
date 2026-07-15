<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_transport_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('has_car')->default(false);
            $table->boolean('uses_public_transport')->default(false);
            $table->boolean('uses_rideshare')->default(false);
            $table->boolean('walks_cycles')->default(false);
            $table->unsignedInteger('max_travel_minutes')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_transport_preferences');
    }
};
