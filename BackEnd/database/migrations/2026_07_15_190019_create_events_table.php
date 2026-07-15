<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organiser_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('community_id')->nullable()->constrained('communities')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('event_categories')->nullOnDelete();
            $table->foreignId('venue_id')->nullable()->constrained('venues')->nullOnDelete();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->boolean('is_beginner_friendly')->default(false);
            $table->boolean('is_free')->default(true);
            $table->unsignedInteger('price_cents')->nullable();
            $table->boolean('is_attend_alone_friendly')->default(false);
            $table->text('transport_notes')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->enum('status', ['draft', 'published', 'cancelled', 'completed'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->float('trending_score')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'community_id']);
            $table->index(['status', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
