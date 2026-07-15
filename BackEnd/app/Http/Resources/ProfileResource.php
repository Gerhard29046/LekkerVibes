<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps a User model (with profile/interests/privacySetting/
 * notificationPreference/transportPreference eager loaded) into the full
 * "my profile" bundle the frontend profile page hydrates from in one call.
 */
class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->profile;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'display_name' => $profile?->display_name,
            'username' => $profile?->username,
            'bio' => $profile?->bio,
            'pronouns' => $profile?->pronouns,
            'age_range' => $profile?->age_range,
            'location' => $profile?->relationLoaded('location') ? new LocationResource($profile->location) : null,
            'avatar_url' => $profile?->relationLoaded('avatarMedia') ? $profile->avatarMedia?->url() : null,
            'cover_url' => $profile?->relationLoaded('coverMedia') ? $profile->coverMedia?->url() : null,
            'alcohol_free_pref' => $profile?->alcohol_free_pref,
            'family_friendly_pref' => $profile?->family_friendly_pref,
            'is_verified' => $profile?->is_verified,
            'member_since' => $profile?->member_since,
            'interests' => InterestResource::collection($this->whenLoaded('interests')),
            'privacy_settings' => $this->whenLoaded('privacySetting', fn () => [
                'profile_visibility' => $this->privacySetting->profile_visibility,
                'show_location' => $this->privacySetting->show_location,
                'show_age' => $this->privacySetting->show_age,
                'show_joined_communities' => $this->privacySetting->show_joined_communities,
            ]),
            'notification_preferences' => $this->whenLoaded('notificationPreference', fn () => [
                'email_enabled' => $this->notificationPreference->email_enabled,
                'push_enabled' => $this->notificationPreference->push_enabled,
                'event_reminders' => $this->notificationPreference->event_reminders,
                'community_updates' => $this->notificationPreference->community_updates,
                'messages' => $this->notificationPreference->messages,
                'marketing' => $this->notificationPreference->marketing,
            ]),
            'transport_preferences' => $this->whenLoaded('transportPreference', fn () => [
                'has_car' => $this->transportPreference->has_car,
                'uses_public_transport' => $this->transportPreference->uses_public_transport,
                'uses_rideshare' => $this->transportPreference->uses_rideshare,
                'walks_cycles' => $this->transportPreference->walks_cycles,
                'max_travel_minutes' => $this->transportPreference->max_travel_minutes,
                'notes' => $this->transportPreference->notes,
            ]),
        ];
    }
}
