<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('logo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->enum('visibility', ['public', 'private'])->default('public');
            $table->enum('join_policy', ['open', 'request', 'invite_only'])->default('open');
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->unsignedInteger('member_count')->default(0);
            $table->float('trending_score')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communities');
    }
};
