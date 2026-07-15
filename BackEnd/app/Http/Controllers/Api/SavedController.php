<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $events = Event::query()
            ->whereHas('saves', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with(['category', 'venue.location', 'coverMedia', 'community'])
            ->with(['occurrences' => fn ($q) => $q->where('starts_at', '>=', now())->orderBy('starts_at')->limit(1)])
            ->with(['saves' => fn ($q) => $q->where('user_id', $request->user()->id)])
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => EventResource::collection($events->items())]);
    }
}
