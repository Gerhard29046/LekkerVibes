# Database

MySQL 8.4, database `lekkervibes`, host `127.0.0.1`, port `3307`, charset
`utf8mb4_unicode_ci`. Schema lives entirely in
`BackEnd/database/migrations/*.php` — this document is a human-readable map
of it, not the source of truth (if this doc and the migrations ever
disagree, the migrations win — update this doc).

Reset history and the old (abandoned) schema this replaced are in
`DECISIONS.md` and `documentation/db-archive/`.

## Domain groups

### Identity & profile

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Auth identity | `email` (unique), `password`, `phone`, `is_admin`, `status` (active/suspended/deleted), `last_active_at`, soft deletes |
| `user_profiles` | Public profile | 1:1 `user_id`, `display_name`, `username` (unique), `bio`, `pronouns`, `age_range`, `location_id`, `avatar_media_id`, `cover_media_id`, `alcohol_free_pref`, `family_friendly_pref`, `is_verified`, `member_since`, soft deletes |
| `user_photos` | Profile gallery | `user_id`, `media_id`, `position` |
| `privacy_settings` | 1:1 privacy prefs | `profile_visibility` (public/members_only/private), `show_location`, `show_age`, `show_joined_communities` |
| `notification_preferences` | 1:1 notification prefs | `email_enabled`, `push_enabled`, `event_reminders`, `community_updates`, `messages`, `marketing` |
| `user_saved_areas` | Saved discovery areas | `user_id`, `location_id`, `label`, `radius_km`, `is_default`; unique per (user, location) |
| `user_transport_preferences` | 1:1 transport prefs | `has_car`, `uses_public_transport`, `uses_rideshare`, `walks_cycles`, `max_travel_minutes`, `notes` |
| `interests` / `interest_user` | Interest taxonomy + pivot | `interests`: `name`, `slug`, `icon`, `category`; pivot has composite PK `(user_id, interest_id)` |

### Location

| Table | Purpose | Key columns |
|---|---|---|
| `locations` | Self-referential province → city → town → suburb hierarchy | `type` enum, `name`, `slug`, `parent_id` (self FK), `province` (denormalized display string), `latitude`/`longitude`, `is_popular`; unique per `(type, parent_id, slug)` |

The searchable location combobox queries this table (filtered by `type`,
`parent_id`, `is_popular`, and text search on `name`). Seed data covers
Table View, Blouberg, Cape Town CBD, Sea Point, Stellenbosch, Paarl,
Somerset West, Durbanville, Bellville, George (see `database/seeders/`).

### Media

| Table | Purpose | Key columns |
|---|---|---|
| `media` | Central uploaded-file record, referenced by FK from every other table needing an image/attachment | `uploader_id`, `disk`, `path`, `original_filename`, `mime_type`, `size_bytes`, `width`, `height`, soft deletes |

### Events & activities

| Table | Purpose | Key columns |
|---|---|---|
| `event_categories` | Category taxonomy | `name`, `slug`, `icon`, `color` |
| `venues` | Physical or public meeting-point locations | `location_id`, `address_line`, `latitude`/`longitude`, `is_public_meeting_point`, `notes`, soft deletes |
| `events` | Event/activity definition | `organiser_id`, `community_id` (nullable — independent organisers allowed), `category_id`, `venue_id`, `cover_media_id`, `title`, `slug`, `description`, `is_recurring`, `is_beginner_friendly`, `is_free`, `price_cents`, `is_attend_alone_friendly`, `transport_notes`, `capacity`, `status` (draft/published/cancelled/completed), `published_at`, `trending_score`, soft deletes |
| `recurring_schedules` | 1:1 recurrence rule for a recurring event | `event_id`, `frequency` (weekly/biweekly/monthly), `interval`, `byweekday` (JSON), `starts_on`/`ends_on`, `start_time`, `duration_minutes` |
| `event_occurrences` | Dated instances of an event (single events get exactly one) | `event_id`, `venue_id` (override), `starts_at`/`ends_at`, `capacity`, `spots_remaining`, `status`; unique per `(event_id, starts_at)` |
| `event_attendees` | RSVP/attendance per occurrence | `event_occurrence_id`, `user_id`, `status` (interested/going/attended/cancelled/no_show); unique per (occurrence, user) |
| `event_saves` | Bookmarks | unique per (user, event) |
| `event_images` | Gallery | `event_id`, `media_id`, `position` |

**Series vs. instance split:** unlike the old Base44 `Activity` entity (which
mixed series-level and instance-level fields on one flat record), `events`
holds series-level data and `event_occurrences` holds dated instances —
attendance, capacity and spots-remaining are tracked per occurrence.

### Communities

| Table | Purpose | Key columns |
|---|---|---|
| `communities` | Community/club | `creator_id`, `name`, `slug`, `description`, `location_id`, `cover_media_id`, `logo_media_id`, `visibility` (public/private), `join_policy` (open/request/invite_only), `status` (active/archived), `member_count` (denormalized), `trending_score`, soft deletes |
| `community_roles` | Per-community permission overrides for the 3 fixed tiers | `community_id`, `key` (member/moderator/organiser), `label`, `can_manage_members`, `can_manage_events`, `can_post_announcements`; see `DECISIONS.md` |
| `community_members` | Membership | `community_id`, `user_id`, `role` (member/moderator/organiser — source of truth for tier), `status` (active/pending/banned), `joined_at`; unique per (community, user) |
| `community_rules` | Ordered rule list | `community_id`, `position`, `title`, `description` |
| `community_images` | Gallery | `community_id`, `media_id`, `position` |
| `membership_requests` | Request-to-join workflow (when `join_policy = request`) | `community_id`, `user_id`, `message`, `status` (pending/approved/rejected), `reviewed_by`, `reviewed_at` |
| `community_activities` | Cross-links an event into a community's feed beyond primary `events.community_id` ownership | unique per (community, event); see `DECISIONS.md` |

### Messaging (group-based — no open direct messaging)

| Table | Purpose | Key columns |
|---|---|---|
| `conversations` | A chat thread scoped to a community, event, welcome group, or organiser announcement channel | `type` enum, `community_id`, `event_id`, `title`, `created_by`, soft deletes |
| `conversation_members` | Membership + per-user mute state | `conversation_id`, `user_id`, `role` (member/admin), `is_muted`, `joined_at`; unique per (conversation, user) |
| `messages` | Individual messages | `conversation_id`, `sender_id` (nullable = system message), `body`, `is_system`, soft deletes |
| `message_reads` | Read receipts | `message_id`, `user_id`, `read_at`; unique per (message, user); no `updated_at` |
| `message_attachments` | Attached media | `message_id`, `media_id` |
| `welcome_groups` | Marks which conversation is "the" welcome group for a community or event | `community_id`, `event_id`, `conversation_id` (unique) |

### Safety & moderation

| Table | Purpose | Key columns |
|---|---|---|
| `reports` | Polymorphic report against any reportable model | `reporter_id`, `reportable_type`/`reportable_id`, `reason` enum, `details`, `status` (open/reviewing/resolved/dismissed), `resolved_by`, `resolved_at` |
| `blocks` | User-to-user block | `blocker_id`, `blocked_id`; unique per pair |
| `moderation_actions` | Audit log of moderator actions | `moderator_id`, `community_id`, polymorphic `target_type`/`target_id`, `action` enum, `reason` |
| `organiser_verifications` | Organiser verification workflow | `user_id`, `community_id`, `status` (pending/approved/rejected), `document_media_id`, `notes`, `reviewed_by`, `reviewed_at` |

### Misc

| Table | Purpose |
|---|---|
| `external_event_sources` | Config for future external event feed ingestion (`ics_feed`/`api`/`manual_partner`) — not actively consumed yet |
| `notifications` | Laravel's standard polymorphic notifications table (framework-provided schema, no custom model) — see `DECISIONS.md` |
| `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `sessions`, `password_reset_tokens`, `personal_access_tokens` | Laravel framework internals (queue, cache, Sanctum tokens) |

## Conventions

- Every FK-carrying table uses `foreignId(...)->constrained(...)` with an
  explicit `nullOnDelete()` or `cascadeOnDelete()` — see each migration for
  the exact cascade behaviour, chosen per whether the child record is
  meaningless without the parent (cascade) or should survive as an orphaned
  reference (null on delete, e.g. `organiser_id` on `events`).
- Soft deletes are used on records users can "delete" but that other rows
  still reference (users, media, venues, user_profiles, communities, events,
  conversations, messages) — hard deletes elsewhere.
- Enums are used for small fixed value sets; nothing free-text where a
  constrained set makes sense.
