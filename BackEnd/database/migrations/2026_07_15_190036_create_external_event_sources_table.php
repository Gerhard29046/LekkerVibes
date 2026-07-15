<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_event_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('source_type', ['ics_feed', 'api', 'manual_partner']);
            $table->string('url')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_event_sources');
    }
};
