<?php

namespace Tests\Feature\Communities;

use App\Models\Community;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_community_auto_creates_organiser_membership_and_welcome_group(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/communities', [
            'name' => 'Cape Town Padel Crew',
            'description' => 'Casual padel games',
            'join_policy' => 'open',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Cape Town Padel Crew')
            ->assertJsonPath('data.member_count', 1)
            ->assertJsonPath('data.my_membership.role', 'organiser');

        $communityId = $response->json('data.id');
        $this->assertDatabaseHas('community_members', [
            'community_id' => $communityId, 'user_id' => $user->id, 'role' => 'organiser',
        ]);
        $this->assertDatabaseHas('conversations', ['community_id' => $communityId, 'type' => 'welcome_group']);
        $this->assertNotNull($response->json('data.welcome_conversation_id'));
    }

    public function test_user_can_join_an_open_community(): void
    {
        $organiser = User::factory()->create();
        $joiner = User::factory()->create();
        $community = Community::create([
            'creator_id' => $organiser->id,
            'name' => 'Sea Point Book Club',
            'slug' => 'sea-point-book-club',
            'join_policy' => 'open',
            'status' => 'active',
            'member_count' => 0,
        ]);

        Sanctum::actingAs($joiner);
        $response = $this->postJson("/api/communities/{$community->id}/join");

        $response->assertStatus(200)->assertJsonPath('status', 'active');
        $this->assertEquals(1, $community->fresh()->member_count);
    }

    public function test_request_to_join_community_creates_a_pending_request_not_a_membership(): void
    {
        $organiser = User::factory()->create();
        $requester = User::factory()->create();
        $community = Community::create([
            'creator_id' => $organiser->id,
            'name' => 'Invite Vetted Book Club',
            'slug' => 'invite-vetted-book-club',
            'join_policy' => 'request',
            'status' => 'active',
        ]);

        Sanctum::actingAs($requester);
        $response = $this->postJson("/api/communities/{$community->id}/join");

        $response->assertStatus(200)->assertJsonPath('status', 'request_pending');
        $this->assertDatabaseHas('membership_requests', [
            'community_id' => $community->id, 'user_id' => $requester->id, 'status' => 'pending',
        ]);
        $this->assertDatabaseMissing('community_members', [
            'community_id' => $community->id, 'user_id' => $requester->id,
        ]);
    }

    public function test_only_organiser_or_moderator_can_view_membership_requests(): void
    {
        $organiser = User::factory()->create();
        $stranger = User::factory()->create();
        $community = Community::create([
            'creator_id' => $organiser->id,
            'name' => 'Private Book Club',
            'slug' => 'private-book-club',
            'join_policy' => 'request',
            'status' => 'active',
        ]);

        Sanctum::actingAs($stranger);
        $this->getJson("/api/communities/{$community->id}/membership-requests")->assertStatus(403);

        Sanctum::actingAs($organiser);
        $this->getJson("/api/communities/{$community->id}/membership-requests")->assertStatus(200);
    }

    public function test_approving_a_membership_request_creates_active_membership_and_increments_count(): void
    {
        $organiser = User::factory()->create();
        $requester = User::factory()->create();
        $community = Community::create([
            'creator_id' => $organiser->id,
            'name' => 'Curated Running Club',
            'slug' => 'curated-running-club',
            'join_policy' => 'request',
            'status' => 'active',
            'member_count' => 1,
        ]);
        $community->members()->create(['user_id' => $organiser->id, 'role' => 'organiser', 'status' => 'active']);
        $membershipRequest = $community->membershipRequests()->create([
            'user_id' => $requester->id, 'status' => 'pending',
        ]);

        Sanctum::actingAs($organiser);
        $response = $this->postJson("/api/communities/{$community->id}/membership-requests/{$membershipRequest->id}/approve");

        $response->assertStatus(200)->assertJsonPath('data.status', 'approved');
        $this->assertDatabaseHas('community_members', [
            'community_id' => $community->id, 'user_id' => $requester->id, 'status' => 'active',
        ]);
        $this->assertEquals(2, $community->fresh()->member_count);
    }
}
