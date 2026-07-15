<?php

namespace Database\Seeders;

use App\Models\Interest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InterestSeeder extends Seeder
{
    public function run(): void
    {
        $interests = [
            'Outdoors' => ['Hiking', 'Trail Running', 'Beach Days', 'Mountain Biking', 'Camping', 'Surfing'],
            'Sports & Fitness' => ['Padel', 'Yoga', 'Running Club', 'Cycling', 'Rock Climbing', 'Swimming'],
            'Social' => ['Board Games', 'Pub Quiz', 'Braai & Chill', 'Book Club', 'Trivia Nights'],
            'Arts & Culture' => ['Live Music', 'Photography', 'Art & Design', 'Theatre', 'Dance'],
            'Food & Drink' => ['Food & Wine', 'Craft Beer', 'Coffee Culture', 'Cooking Together'],
            'Wellness' => ['Meditation', 'Mindfulness', 'Sound Healing', 'Journaling'],
            'Learning & Community' => ['Language Exchange', 'Tech Meetups', 'Volunteering', 'Beach Cleanups', 'Networking'],
        ];

        foreach ($interests as $category => $names) {
            foreach ($names as $name) {
                Interest::create([
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'icon' => null,
                    'category' => $category,
                ]);
            }
        }
    }
}
