<?php

namespace Tests\Feature\Profile;

use App\Models\Interest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function registeredUser(): User
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Amara Okafor',
            'email' => 'amara@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        return User::where('email', 'amara@example.com')->first();
    }

    public function test_authenticated_user_can_view_their_profile_bundle(): void
    {
        $user = $this->registeredUser();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/profile');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [
                'id', 'display_name', 'username', 'privacy_settings', 'notification_preferences',
            ]]);
    }

    public function test_user_can_update_their_profile_fields(): void
    {
        $user = $this->registeredUser();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'bio' => 'Trail runner and coffee enthusiast.',
            'pronouns' => 'she/her',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.bio', 'Trail runner and coffee enthusiast.')
            ->assertJsonPath('data.pronouns', 'she/her');
    }

    public function test_user_cannot_take_an_already_taken_username(): void
    {
        $user = $this->registeredUser();
        $other = User::factory()->create();
        $other->profile()->create(['display_name' => $other->name, 'username' => 'takenname']);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', ['username' => 'takenname']);

        $response->assertStatus(422)->assertJsonValidationErrors('username');
    }

    public function test_user_can_sync_their_interests(): void
    {
        $user = $this->registeredUser();
        $interestIds = collect(['Hiking', 'Padel', 'Book Club'])->map(
            fn ($name) => Interest::create(['name' => $name, 'slug' => Str::slug($name), 'category' => 'Test'])->id
        );
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile/interests', [
            'interest_ids' => $interestIds->all(),
        ]);

        $response->assertStatus(200);
        $this->assertCount(3, $user->fresh()->interests);
    }

    public function test_profile_endpoints_require_authentication(): void
    {
        $this->getJson('/api/profile')->assertStatus(401);
        $this->putJson('/api/profile', ['bio' => 'x'])->assertStatus(401);
    }
}
