<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $province = Location::create([
            'type' => 'province',
            'name' => 'Western Cape',
            'slug' => Str::slug('Western Cape'),
            'parent_id' => null,
            'province' => 'Western Cape',
            'latitude' => -33.9249,
            'longitude' => 18.4241,
            'is_popular' => true,
        ]);

        $capeTown = Location::create([
            'type' => 'city',
            'name' => 'Cape Town',
            'slug' => Str::slug('Cape Town'),
            'parent_id' => $province->id,
            'province' => 'Western Cape',
            'latitude' => -33.9249,
            'longitude' => 18.4241,
            'is_popular' => true,
        ]);

        $suburbs = [
            ['name' => 'Cape Town CBD', 'lat' => -33.9249, 'lng' => 18.4241, 'popular' => true],
            ['name' => 'Sea Point', 'lat' => -33.9147, 'lng' => 18.3852, 'popular' => true],
            ['name' => 'Table View', 'lat' => -33.8186, 'lng' => 18.4802, 'popular' => true],
            ['name' => 'Blouberg', 'lat' => -33.8020, 'lng' => 18.4700, 'popular' => true],
            ['name' => 'Durbanville', 'lat' => -33.8303, 'lng' => 18.6470, 'popular' => false],
            ['name' => 'Bellville', 'lat' => -33.9000, 'lng' => 18.6292, 'popular' => false],
        ];

        foreach ($suburbs as $suburb) {
            Location::create([
                'type' => 'suburb',
                'name' => $suburb['name'],
                'slug' => Str::slug($suburb['name']),
                'parent_id' => $capeTown->id,
                'province' => 'Western Cape',
                'latitude' => $suburb['lat'],
                'longitude' => $suburb['lng'],
                'is_popular' => $suburb['popular'],
            ]);
        }

        $towns = [
            ['name' => 'Stellenbosch', 'lat' => -33.9321, 'lng' => 18.8602, 'popular' => true],
            ['name' => 'Paarl', 'lat' => -33.7342, 'lng' => 18.9621, 'popular' => false],
            ['name' => 'Somerset West', 'lat' => -34.0736, 'lng' => 18.8529, 'popular' => false],
            ['name' => 'George', 'lat' => -33.9628, 'lng' => 22.4619, 'popular' => false],
        ];

        foreach ($towns as $town) {
            Location::create([
                'type' => 'town',
                'name' => $town['name'],
                'slug' => Str::slug($town['name']),
                'parent_id' => $province->id,
                'province' => 'Western Cape',
                'latitude' => $town['lat'],
                'longitude' => $town['lng'],
                'is_popular' => $town['popular'],
            ]);
        }
    }
}
