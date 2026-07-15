<?php

namespace Database\Seeders;

use App\Models\Community;
use App\Models\CommunityMember;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventOccurrence;
use App\Models\Interest;
use App\Models\Location;
use App\Models\Message;
use App\Models\User;
use App\Models\Venue;
use App\Models\WelcomeGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Realistic fictional data for local development only — never run in
 * production. Uses the seeded Western Cape locations, interests, and event
 * categories, so those seeders must run first.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $capeTown = Location::where('name', 'Cape Town')->where('type', 'city')->firstOrFail();
        $seaPoint = Location::where('name', 'Sea Point')->firstOrFail();
        $bloubergLoc = Location::where('name', 'Blouberg')->firstOrFail();
        $stellenbosch = Location::where('name', 'Stellenbosch')->firstOrFail();

        $people = [
            ['name' => 'Thandiwe Nkosi', 'email' => 'thandiwe@example.com', 'username' => 'thandiwe_n', 'bio' => 'Trail runner, coffee addict, always down for a sunrise hike.'],
            ['name' => 'Pieter van der Merwe', 'email' => 'pieter@example.com', 'username' => 'pieter_vdm', 'bio' => 'Padel on weekends, braai enthusiast, dog dad to a border collie.'],
            ['name' => 'Amara Okafor', 'email' => 'amara@example.com', 'username' => 'amara_o', 'bio' => 'Book club organiser and part-time watercolour painter.'],
            ['name' => 'Liam Adams', 'email' => 'liam@example.com', 'username' => 'liam_a', 'bio' => 'Surf instructor at Muizenberg, beach cleanup regular.'],
            ['name' => 'Zanele Dlamini', 'email' => 'zanele@example.com', 'username' => 'zanele_d', 'bio' => 'Yoga teacher, plant-based foodie, new to Cape Town.'],
            ['name' => 'Rowan Fisher', 'email' => 'rowan@example.com', 'username' => 'rowan_f', 'bio' => 'Board game night host, software dev, craft beer curious.'],
            ['name' => 'Naledi Mokoena', 'email' => 'naledi@example.com', 'username' => 'naledi_m', 'bio' => 'Stellenbosch wine tours guide and weekend cyclist.'],
            ['name' => 'Sipho Radebe', 'email' => 'sipho@example.com', 'username' => 'sipho_r', 'bio' => 'Photography meetup regular, loves a good sunset shoot.'],
        ];

        $users = collect($people)->map(function (array $person) {
            $user = User::create([
                'name' => $person['name'],
                'email' => $person['email'],
                'password' => Hash::make('password123'),
                'status' => 'active',
                'last_active_at' => now(),
            ]);

            $user->profile()->create([
                'display_name' => $person['name'],
                'username' => $person['username'],
                'bio' => $person['bio'],
                'member_since' => now()->subMonths(random_int(1, 18))->toDateString(),
                'is_verified' => random_int(0, 1) === 1,
            ]);
            $user->privacySetting()->create([]);
            $user->notificationPreference()->create([]);
            $user->transportPreference()->create([
                'has_car' => random_int(0, 1) === 1,
                'uses_public_transport' => random_int(0, 1) === 1,
            ]);

            $interestIds = Interest::inRandomOrder()->limit(random_int(3, 6))->pluck('id');
            $user->interests()->sync($interestIds);

            return $user;
        });

        $organiser = $users[1]; // Pieter
        $bookClubHost = $users[2]; // Amara

        $padelCommunity = Community::create([
            'creator_id' => $organiser->id,
            'name' => 'Cape Town Padel Crew',
            'slug' => Str::slug('Cape Town Padel Crew'),
            'description' => 'Casual padel games every week for players of all levels. No egos, just good rallies and cold drinks after.',
            'location_id' => $capeTown->id,
            'visibility' => 'public',
            'join_policy' => 'open',
            'status' => 'active',
        ]);

        $bookClub = Community::create([
            'creator_id' => $bookClubHost->id,
            'name' => 'Sea Point Book Club',
            'slug' => Str::slug('Sea Point Book Club'),
            'description' => 'Monthly book discussions with a sea view. One novel a month, all genres welcome.',
            'location_id' => $seaPoint->id,
            'visibility' => 'public',
            'join_policy' => 'request',
            'status' => 'active',
        ]);

        foreach ([$padelCommunity, $bookClub] as $community) {
            $community->rules()->createMany([
                ['position' => 1, 'title' => 'Be kind', 'description' => 'Respect every member, always.'],
                ['position' => 2, 'title' => 'Show up or say so', 'description' => "RSVP honestly — it's not fair on others to no-show without notice."],
            ]);
        }

        $memberPool = $users->reject(fn ($u) => $u->is($organiser))->values();
        foreach ($memberPool->take(5) as $member) {
            CommunityMember::create([
                'community_id' => $padelCommunity->id,
                'user_id' => $member->id,
                'role' => 'member',
                'status' => 'active',
                'joined_at' => now()->subDays(random_int(1, 60)),
            ]);
        }
        CommunityMember::create([
            'community_id' => $padelCommunity->id,
            'user_id' => $organiser->id,
            'role' => 'organiser',
            'status' => 'active',
            'joined_at' => now()->subMonths(6),
        ]);

        foreach ($memberPool->reject(fn ($u) => $u->is($bookClubHost))->take(4) as $member) {
            CommunityMember::create([
                'community_id' => $bookClub->id,
                'user_id' => $member->id,
                'role' => 'member',
                'status' => 'active',
                'joined_at' => now()->subDays(random_int(1, 90)),
            ]);
        }
        CommunityMember::create([
            'community_id' => $bookClub->id,
            'user_id' => $bookClubHost->id,
            'role' => 'organiser',
            'status' => 'active',
            'joined_at' => now()->subMonths(9),
        ]);

        $padelVenue = Venue::create([
            'name' => 'Blouberg Padel Courts',
            'location_id' => $bloubergLoc->id,
            'address_line' => 'Blaauwberg Rd, Blouberg',
            'latitude' => -33.8020,
            'longitude' => 18.4700,
            'is_public_meeting_point' => true,
        ]);

        $bookVenue = Venue::create([
            'name' => 'Sea Point Promenade Coffee Shop',
            'location_id' => $seaPoint->id,
            'address_line' => 'Beach Rd, Sea Point',
            'latitude' => -33.9147,
            'longitude' => 18.3852,
            'is_public_meeting_point' => true,
        ]);

        $hikeVenue = Venue::create([
            'name' => 'Jonkershoek Nature Reserve',
            'location_id' => $stellenbosch->id,
            'address_line' => 'Jonkershoek Rd, Stellenbosch',
            'latitude' => -33.9833,
            'longitude' => 18.9333,
            'is_public_meeting_point' => true,
        ]);

        $sportsCategory = EventCategory::where('name', 'Sports & Fitness')->firstOrFail();
        $socialCategory = EventCategory::where('name', 'Social & Nightlife')->firstOrFail();
        $outdoorsCategory = EventCategory::where('name', 'Outdoors & Adventure')->firstOrFail();

        $events = [
            [
                'organiser' => $organiser,
                'community' => $padelCommunity,
                'category' => $sportsCategory,
                'venue' => $padelVenue,
                'title' => 'Sunday Padel Social',
                'description' => 'Doubles rotation, all skill levels welcome. We rent the court, you bring the energy.',
                'is_beginner_friendly' => true,
                'is_free' => false,
                'price_cents' => 15000,
                'is_attend_alone_friendly' => true,
                'capacity' => 16,
                'occurrences' => 3,
            ],
            [
                'organiser' => $bookClubHost,
                'community' => $bookClub,
                'category' => $socialCategory,
                'venue' => $bookVenue,
                'title' => 'July Book Discussion: Coastal Reads Edition',
                'description' => 'Discussing this month\'s pick over coffee with a sea view. New members welcome.',
                'is_beginner_friendly' => true,
                'is_free' => true,
                'price_cents' => null,
                'is_attend_alone_friendly' => true,
                'capacity' => 20,
                'occurrences' => 1,
            ],
            [
                'organiser' => $users[0],
                'community' => null,
                'category' => $outdoorsCategory,
                'venue' => $hikeVenue,
                'title' => 'Jonkershoek Sunrise Hike',
                'description' => 'Early start, big views. Moderate difficulty, roughly 3 hours round trip. Bring water and layers.',
                'is_beginner_friendly' => false,
                'is_free' => true,
                'price_cents' => null,
                'is_attend_alone_friendly' => true,
                'capacity' => 12,
                'occurrences' => 2,
            ],
        ];

        foreach ($events as $eventData) {
            $event = Event::create([
                'organiser_id' => $eventData['organiser']->id,
                'community_id' => $eventData['community']?->id,
                'category_id' => $eventData['category']->id,
                'venue_id' => $eventData['venue']->id,
                'title' => $eventData['title'],
                'slug' => Str::slug($eventData['title']).'-'.Str::random(6),
                'description' => $eventData['description'],
                'is_beginner_friendly' => $eventData['is_beginner_friendly'],
                'is_free' => $eventData['is_free'],
                'price_cents' => $eventData['price_cents'],
                'is_attend_alone_friendly' => $eventData['is_attend_alone_friendly'],
                'capacity' => $eventData['capacity'],
                'status' => 'published',
                'published_at' => now(),
            ]);

            for ($i = 0; $i < $eventData['occurrences']; $i++) {
                EventOccurrence::create([
                    'event_id' => $event->id,
                    'venue_id' => $eventData['venue']->id,
                    'starts_at' => now()->addDays(7 * ($i + 1))->setTime(9, 0),
                    'ends_at' => now()->addDays(7 * ($i + 1))->setTime(11, 0),
                    'capacity' => $eventData['capacity'],
                    'spots_remaining' => $eventData['capacity'] - random_int(0, 5),
                    'status' => 'scheduled',
                ]);
            }
        }

        // Welcome group for the padel community, with a couple of seed messages.
        $welcomeConversation = Conversation::create([
            'type' => 'welcome_group',
            'community_id' => $padelCommunity->id,
            'title' => 'Welcome to Cape Town Padel Crew',
            'created_by' => $organiser->id,
        ]);
        WelcomeGroup::create([
            'community_id' => $padelCommunity->id,
            'conversation_id' => $welcomeConversation->id,
        ]);
        ConversationMember::create([
            'conversation_id' => $welcomeConversation->id,
            'user_id' => $organiser->id,
            'role' => 'admin',
            'joined_at' => now(),
        ]);
        foreach ($memberPool->take(3) as $member) {
            ConversationMember::create([
                'conversation_id' => $welcomeConversation->id,
                'user_id' => $member->id,
                'role' => 'member',
                'joined_at' => now(),
            ]);
        }
        Message::create([
            'conversation_id' => $welcomeConversation->id,
            'sender_id' => null,
            'body' => 'Welcome to Cape Town Padel Crew! Say hi and let us know your skill level 🎾',
            'is_system' => true,
        ]);
        Message::create([
            'conversation_id' => $welcomeConversation->id,
            'sender_id' => $organiser->id,
            'body' => "Howzit everyone, stoked to have you here. Sunday's game is at 9am, see the event for details!",
        ]);

        // member_count is denormalized (see DATABASE.md) — the memberships
        // API is responsible for keeping it in sync on join/leave; recompute
        // it here since this seeder inserts membership rows directly.
        foreach ([$padelCommunity, $bookClub] as $community) {
            $community->update([
                'member_count' => $community->members()->where('status', 'active')->count(),
            ]);
        }
    }
}
