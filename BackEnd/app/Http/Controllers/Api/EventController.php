<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\StoreEventRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\EventOccurrence;
use App\Models\EventSave;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Public browsing route (no auth:sanctum middleware) — resolve the
        // "sanctum" guard explicitly so a Bearer token still personalizes
        // the response (saved_by_me, "mine" filter) without requiring auth.
        $user = $request->user('sanctum');

        $query = Event::query()->with(['category', 'venue.location', 'coverMedia', 'community']);

        if ($request->boolean('mine') && $user) {
            $query->where('organiser_id', $user->id);
        } else {
            $query->where('status', 'published');
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('community_id')) {
            $query->where('community_id', $request->integer('community_id'));
        }

        if ($request->filled('location_id')) {
            $locationId = $request->integer('location_id');
            $query->whereHas('venue', fn ($q) => $q->where('location_id', $locationId));
        }

        if ($request->boolean('is_beginner_friendly')) {
            $query->where('is_beginner_friendly', true);
        }

        if ($request->has('is_free')) {
            $query->where('is_free', $request->boolean('is_free'));
        }

        if ($request->boolean('is_attend_alone_friendly')) {
            $query->where('is_attend_alone_friendly', true);
        }

        if ($request->filled('search')) {
            $search = '%'.$request->string('search').'%';
            $query->where(fn ($q) => $q->where('title', 'like', $search)->orWhere('description', 'like', $search));
        }

        $query->with(['occurrences' => function ($q) {
            $q->where('starts_at', '>=', now())->orderBy('starts_at')->limit(1);
        }]);

        if ($user) {
            $query->with(['saves' => fn ($q) => $q->where('user_id', $user->id)]);
        }

        $sort = $request->input('sort', '-trending_score');
        match ($sort) {
            '-trending_score' => $query->orderByDesc('trending_score'),
            'starts_at' => $query->orderBy(
                EventOccurrence::select('starts_at')
                    ->whereColumn('event_id', 'events.id')
                    ->where('starts_at', '>=', now())
                    ->orderBy('starts_at')
                    ->limit(1)
            ),
            default => $query->orderByDesc('created_at'),
        };

        $events = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => EventResource::collection($events->items()),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    public function show(Request $request, Event $event): JsonResponse
    {
        $user = $request->user('sanctum');

        $event->load([
            'category', 'venue.location', 'coverMedia', 'community', 'organiser',
            'occurrences' => fn ($q) => $q->orderBy('starts_at'),
            'occurrences.attendees',
            'images.media',
        ]);

        if ($user) {
            $event->load(['saves' => fn ($q) => $q->where('user_id', $user->id)]);
        }

        return response()->json(['data' => new EventResource($event)]);
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $occurrences = $data['occurrences'];
        unset($data['occurrences']);

        $event = Event::create([
            ...$data,
            'organiser_id' => $request->user()->id,
            'slug' => Str::slug($data['title']).'-'.Str::random(6),
            'status' => 'published',
            'published_at' => now(),
        ]);

        foreach ($occurrences as $occurrence) {
            EventOccurrence::create([
                'event_id' => $event->id,
                'venue_id' => $occurrence['venue_id'] ?? $event->venue_id,
                'starts_at' => $occurrence['starts_at'],
                'ends_at' => $occurrence['ends_at'] ?? null,
                'capacity' => $occurrence['capacity'] ?? $event->capacity,
                'spots_remaining' => $occurrence['capacity'] ?? $event->capacity,
                'status' => 'scheduled',
            ]);
        }

        return $this->show($request, $event->fresh());
    }

    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $event->update($request->validated());

        return $this->show($request, $event->fresh());
    }

    public function destroy(Request $request, Event $event): JsonResponse
    {
        $this->authorize('delete', $event);

        $event->delete();

        return response()->json(['deleted' => true]);
    }

    public function save(Request $request, Event $event): JsonResponse
    {
        EventSave::firstOrCreate([
            'user_id' => $request->user()->id,
            'event_id' => $event->id,
        ]);

        return response()->json(['saved' => true]);
    }

    public function unsave(Request $request, Event $event): JsonResponse
    {
        EventSave::where('user_id', $request->user()->id)->where('event_id', $event->id)->delete();

        return response()->json(['saved' => false]);
    }
}
