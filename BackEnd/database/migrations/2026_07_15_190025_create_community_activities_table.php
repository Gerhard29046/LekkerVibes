<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cross-links an event into a community's activity feed beyond the
     * event's primary events.community_id ownership (e.g. a community
     * cross-promoting a partner event it doesn't organise itself).
     */
    public function up(): void
    {
        Schema::create('community_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained('communities')->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['community_id', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_activities');
    }
};
