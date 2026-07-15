<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moderator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('community_id')->nullable()->constrained('communities')->nullOnDelete();
            $table->string('target_type');
            $table->unsignedBigInteger('target_id');
            $table->enum('action', [
                'warn', 'remove_member', 'delete_content', 'suspend_user',
                'ban_user', 'verify_organiser', 'reject_verification',
            ]);
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_actions');
    }
};
