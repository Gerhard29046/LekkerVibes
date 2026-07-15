<?php

namespace Database\Seeders;

use App\Models\EventCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EventCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Outdoors & Adventure', 'color' => '#65A30D'],
            ['name' => 'Sports & Fitness', 'color' => '#0F766E'],
            ['name' => 'Social & Nightlife', 'color' => '#F97366'],
            ['name' => 'Arts & Culture', 'color' => '#7DD3FC'],
            ['name' => 'Food & Drink', 'color' => '#FDBA8C'],
            ['name' => 'Wellness & Mindfulness', 'color' => '#164E63'],
            ['name' => 'Music & Entertainment', 'color' => '#F97366'],
            ['name' => 'Community & Volunteering', 'color' => '#65A30D'],
            ['name' => 'Family Friendly', 'color' => '#FDBA8C'],
            ['name' => 'Networking & Professional', 'color' => '#1F2933'],
        ];

        foreach ($categories as $category) {
            EventCategory::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'icon' => null,
                'color' => $category['color'],
            ]);
        }
    }
}
