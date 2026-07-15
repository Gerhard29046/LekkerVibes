<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-community overrides of the fixed member/moderator/organiser roles
     * (custom label + finer-grained permission flags). community_members.role
     * remains the source of truth for which of the three tiers a member holds;
     * this table only customises what each tier is allowed to do within a
     * given community.
     */
    public function up(): void
    {
        Schema::create('community_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained('communities')->cascadeOnDelete();
            $table->enum('key', ['member', 'moderator', 'organiser']);
            $table->string('label');
            $table->boolean('can_manage_members')->default(false);
            $table->boolean('can_manage_events')->default(false);
            $table->boolean('can_post_announcements')->default(false);
            $table->timestamps();

            $table->unique(['community_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_roles');
    }
};
