<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'phone'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_active_at' => 'datetime',
            'is_admin' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function photos()
    {
        return $this->hasMany(UserPhoto::class);
    }

    public function privacySetting()
    {
        return $this->hasOne(PrivacySetting::class);
    }

    public function notificationPreference()
    {
        return $this->hasOne(NotificationPreference::class);
    }

    public function savedAreas()
    {
        return $this->hasMany(UserSavedArea::class);
    }

    public function transportPreference()
    {
        return $this->hasOne(UserTransportPreference::class);
    }

    public function interests()
    {
        return $this->belongsToMany(Interest::class, 'interest_user');
    }

    public function uploadedMedia()
    {
        return $this->hasMany(Media::class, 'uploader_id');
    }

    public function createdCommunities()
    {
        return $this->hasMany(Community::class, 'creator_id');
    }

    public function communityMemberships()
    {
        return $this->hasMany(CommunityMember::class);
    }

    public function membershipRequests()
    {
        return $this->hasMany(MembershipRequest::class);
    }

    public function reviewedMembershipRequests()
    {
        return $this->hasMany(MembershipRequest::class, 'reviewed_by');
    }

    public function organisedEvents()
    {
        return $this->hasMany(Event::class, 'organiser_id');
    }

    public function eventAttendances()
    {
        return $this->hasMany(EventAttendee::class);
    }

    public function eventSaves()
    {
        return $this->hasMany(EventSave::class);
    }

    public function conversationMemberships()
    {
        return $this->hasMany(ConversationMember::class);
    }

    public function createdConversations()
    {
        return $this->hasMany(Conversation::class, 'created_by');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messageReads()
    {
        return $this->hasMany(MessageRead::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function resolvedReports()
    {
        return $this->hasMany(Report::class, 'resolved_by');
    }

    public function blocksInitiated()
    {
        return $this->hasMany(Block::class, 'blocker_id');
    }

    public function blocksReceived()
    {
        return $this->hasMany(Block::class, 'blocked_id');
    }

    public function moderationActions()
    {
        return $this->hasMany(ModerationAction::class, 'moderator_id');
    }

    public function organiserVerifications()
    {
        return $this->hasMany(OrganiserVerification::class);
    }

    public function reviewedOrganiserVerifications()
    {
        return $this->hasMany(OrganiserVerification::class, 'reviewed_by');
    }
}
