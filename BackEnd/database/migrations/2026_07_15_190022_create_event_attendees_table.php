<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_occurrence_id')->constrained('event_occurrences')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['interested', 'going', 'attended', 'cancelled', 'no_show'])->default('going');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['event_occurrence_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_attendees');
    }
};
