<?php

namespace Tests\Feature\Messaging;

use App\Models\Community;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MessagingTest extends TestCase
{
    use RefreshDatabase;

    private function communityWithWelcomeGroup(): array
    {
        $organiser = User::factory()->create();
        $community = Community::create([
            'creator_id' => $organiser->id,
            'name' => 'Cape Town Padel Crew',
            'slug' => 'cape-town-padel-crew',
            'join_policy' => 'open',
            'status' => 'active',
        ]);
        $conversation = Conversation::create([
            'type' => 'welcome_group',
            'community_id' => $community->id,
            'title' => 'Welcome to Cape Town Padel Crew',
            'created_by' => $organiser->id,
        ]);
        $conversation->members()->create(['user_id' => $organiser->id, 'role' => 'admin']);

        return [$community, $conversation, $organiser];
    }

    public function test_non_member_cannot_view_or_send_messages_in_a_conversation(): void
    {
        [, $conversation] = $this->communityWithWelcomeGroup();
        $outsider = User::factory()->create();

        Sanctum::actingAs($outsider);

        $this->getJson("/api/conversations/{$conversation->id}/messages")->assertStatus(403);
        $this->postJson("/api/conversations/{$conversation->id}/messages", ['body' => 'hi'])->assertStatus(403);
    }

    public function test_member_can_send_and_list_messages(): void
    {
        [, $conversation, $organiser] = $this->communityWithWelcomeGroup();

        Sanctum::actingAs($organiser);

        $this->postJson("/api/conversations/{$conversation->id}/messages", ['body' => 'Howzit everyone!'])
            ->assertStatus(201)
            ->assertJsonPath('data.body', 'Howzit everyone!');

        $list = $this->getJson("/api/conversations/{$conversation->id}/messages");
        $list->assertStatus(200);
        $this->assertCount(1, $list->json('data'));
    }

    public function test_deleting_a_message_leaves_a_placeholder_not_a_hard_delete(): void
    {
        [, $conversation, $organiser] = $this->communityWithWelcomeGroup();
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $organiser->id,
            'body' => 'Oops, wrong chat',
        ]);

        Sanctum::actingAs($organiser);
        $this->deleteJson("/api/messages/{$message->id}")->assertStatus(200)->assertJsonPath('deleted', true);

        $this->assertSoftDeleted('messages', ['id' => $message->id]);

        $list = $this->getJson("/api/conversations/{$conversation->id}/messages");
        $listed = collect($list->json('data'))->firstWhere('id', $message->id);
        $this->assertTrue($listed['is_deleted']);
        $this->assertNull($listed['body']);
    }

    public function test_non_sender_cannot_delete_someone_elses_message(): void
    {
        [, $conversation, $organiser] = $this->communityWithWelcomeGroup();
        $otherMember = User::factory()->create();
        $conversation->members()->create(['user_id' => $otherMember->id, 'role' => 'member']);
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $organiser->id,
            'body' => 'Organiser message',
        ]);

        Sanctum::actingAs($otherMember);
        $this->deleteJson("/api/messages/{$message->id}")->assertStatus(403);
    }
}
