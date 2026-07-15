<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->unique()->constrained('events')->cascadeOnDelete();
            $table->enum('frequency', ['weekly', 'biweekly', 'monthly']);
            $table->unsignedInteger('interval')->default(1);
            $table->json('byweekday')->nullable();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->time('start_time');
            $table->unsignedInteger('duration_minutes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_schedules');
    }
};
