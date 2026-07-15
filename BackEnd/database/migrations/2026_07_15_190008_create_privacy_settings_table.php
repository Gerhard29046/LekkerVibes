<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('privacy_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->enum('profile_visibility', ['public', 'members_only', 'private'])->default('public');
            $table->boolean('show_location')->default(true);
            $table->boolean('show_age')->default(false);
            $table->boolean('show_joined_communities')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('privacy_settings');
    }
};
