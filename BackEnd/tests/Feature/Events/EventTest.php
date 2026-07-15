<?php

namespace Tests\Feature\Events;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventOccurrence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventTest extends TestCase
{
    use RefreshDatabase;

    private function category(): EventCategory
    {
        return EventCategory::create(['name' => 'Outdoors', 'slug' => 'outdoors']);
    }

    public function test_guest_can_browse_published_events(): void
    {
        $organiser = User::factory()->create();
        Event::create([
            'organiser_id' => $organiser->id,
            'category_id' => $this->category()->id,
            'title' => 'Sunrise Hike',
            'slug' => 'sunrise-hike',
            'status' => 'published',
            'is_free' => true,
            'published_at' => now(),
        ]);
        Event::create([
            'organiser_id' => $organiser->id,
            'title' => 'Draft Event',
            'slug' => 'draft-event',
            'status' => 'draft',
            'is_free' => true,
        ]);

        $response = $this->getJson('/api/events');

        $response->assertStatus(200);
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Sunrise Hike'));
        $this->assertFalse($titles->contains('Draft Event'));
    }

    public function test_authenticated_user_can_create_an_event_with_occurrences(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/events', [
            'title' => 'Padel Social',
            'description' => 'Casual doubles',
            'is_free' => false,
            'price_cents' => 15000,
            'occurrences' => [
                ['starts_at' => now()->addWeek()->toDateTimeString()],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Padel Social')
            ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('events', ['title' => 'Padel Social', 'organiser_id' => $user->id]);
        $this->assertDatabaseCount('event_occurrences', 1);
    }

    public function test_event_creation_requires_at_least_one_occurrence(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/events', [
            'title' => 'No Occurrences Event',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('occurrences');
    }

    public function test_only_the_organiser_can_update_their_event(): void
    {
        $organiser = User::factory()->create();
        $stranger = User::factory()->create();
        $event = Event::create([
            'organiser_id' => $organiser->id,
            'title' => 'Beach Cleanup',
            'slug' => 'beach-cleanup',
            'status' => 'published',
        ]);

        Sanctum::actingAs($stranger);
        $this->putJson("/api/events/{$event->id}", ['title' => 'Hijacked'])->assertStatus(403);

        Sanctum::actingAs($organiser);
        $this->putJson("/api/events/{$event->id}", ['title' => 'Updated Title'])
            ->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Title');
    }

    public function test_user_can_join_and_leave_an_event_occurrence_with_spot_tracking(): void
    {
        $organiser = User::factory()->create();
        $attendee = User::factory()->create();
        $event = Event::create([
            'organiser_id' => $organiser->id,
            'title' => 'Yoga in the Park',
            'slug' => 'yoga-in-the-park',
            'status' => 'published',
            'capacity' => 10,
        ]);
        $occurrence = EventOccurrence::create([
            'event_id' => $event->id,
            'starts_at' => now()->addDays(3),
            'capacity' => 10,
            'spots_remaining' => 10,
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($attendee);

        $this->postJson("/api/events/occurrences/{$occurrence->id}/join", ['status' => 'going'])
            ->assertStatus(200)
            ->assertJsonPath('status', 'going');
        $this->assertEquals(9, $occurrence->fresh()->spots_remaining);

        $this->postJson("/api/events/occurrences/{$occurrence->id}/leave")
            ->assertStatus(200);
        $this->assertEquals(10, $occurrence->fresh()->spots_remaining);
    }

    public function test_user_can_save_and_unsave_an_event(): void
    {
        $organiser = User::factory()->create();
        $user = User::factory()->create();
        $event = Event::create([
            'organiser_id' => $organiser->id,
            'title' => 'Book Club Meetup',
            'slug' => 'book-club-meetup',
            'status' => 'published',
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/events/{$event->id}/save")->assertStatus(200)->assertJsonPath('saved', true);
        $this->assertDatabaseHas('event_saves', ['user_id' => $user->id, 'event_id' => $event->id]);

        $saved = $this->getJson('/api/events?'.http_build_query(['mine' => 0]));
        $eventInList = collect($saved->json('data'))->firstWhere('id', $event->id);
        $this->assertTrue($eventInList['saved_by_me']);

        $this->deleteJson("/api/events/{$event->id}/save")->assertStatus(200)->assertJsonPath('saved', false);
        $this->assertDatabaseMissing('event_saves', ['user_id' => $user->id, 'event_id' => $event->id]);
    }
}
