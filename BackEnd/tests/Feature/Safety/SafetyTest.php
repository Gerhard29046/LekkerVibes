<?php

namespace Tests\Feature\Safety;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_report_another_user(): void
    {
        $reporter = User::factory()->create();
        $target = User::factory()->create();
        Sanctum::actingAs($reporter);

        $response = $this->postJson('/api/reports', [
            'reportable_type' => 'user',
            'reportable_id' => $target->id,
            'reason' => 'harassment',
            'details' => 'Sent inappropriate messages.',
        ]);

        $response->assertStatus(201)->assertJsonPath('data.status', 'open');
        $this->assertDatabaseHas('reports', [
            'reporter_id' => $reporter->id,
            'reportable_id' => $target->id,
            'reason' => 'harassment',
        ]);
    }

    public function test_non_admin_cannot_list_reports(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $this->getJson('/api/reports')->assertStatus(403);
    }

    public function test_admin_can_list_and_resolve_reports(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $reporter = User::factory()->create();
        $target = User::factory()->create();
        Sanctum::actingAs($reporter);
        $reportId = $this->postJson('/api/reports', [
            'reportable_type' => 'user', 'reportable_id' => $target->id, 'reason' => 'spam',
        ])->json('data.id');

        Sanctum::actingAs($admin);
        $this->getJson('/api/reports')->assertStatus(200);
        $this->postJson("/api/reports/{$reportId}/resolve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'resolved');
    }

    public function test_user_can_block_and_unblock_another_user(): void
    {
        $blocker = User::factory()->create();
        $blocked = User::factory()->create();
        Sanctum::actingAs($blocker);

        $this->postJson('/api/blocks', ['blocked_id' => $blocked->id])->assertStatus(201);
        $this->assertDatabaseHas('blocks', ['blocker_id' => $blocker->id, 'blocked_id' => $blocked->id]);

        $list = $this->getJson('/api/blocks');
        $list->assertStatus(200);
        $this->assertCount(1, $list->json('data'));

        $this->deleteJson("/api/blocks/{$blocked->id}")->assertStatus(200);
        $this->assertDatabaseMissing('blocks', ['blocker_id' => $blocker->id, 'blocked_id' => $blocked->id]);
    }

    public function test_user_cannot_block_themselves(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/blocks', ['blocked_id' => $user->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('blocked_id');
    }
}
