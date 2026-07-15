<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['province', 'city', 'town', 'suburb']);
            $table->string('name');
            $table->string('slug');
            $table->foreignId('parent_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('province')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_popular')->default(false);
            $table->timestamps();

            $table->unique(['type', 'parent_id', 'slug']);
            $table->index(['type', 'is_popular']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
