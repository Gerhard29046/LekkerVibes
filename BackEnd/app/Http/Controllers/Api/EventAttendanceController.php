<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventAttendee;
use App\Models\EventOccurrence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EventAttendanceController extends Controller
{
    public function join(Request $request, EventOccurrence $occurrence): JsonResponse
    {
        $request->validate([
            'status' => ['sometimes', Rule::in(['interested', 'going'])],
        ]);
        $status = $request->input('status', 'going');

        $existing = EventAttendee::where('event_occurrence_id', $occurrence->id)
            ->where('user_id', $request->user()->id)
            ->first();

        $wasGoing = $existing && $existing->status === 'going';

        if ($existing) {
            $existing->update(['status' => $status]);
            $attendee = $existing;
        } else {
            $attendee = EventAttendee::create([
                'event_occurrence_id' => $occurrence->id,
                'user_id' => $request->user()->id,
                'status' => $status,
                'joined_at' => now(),
            ]);
        }

        if ($status === 'going' && ! $wasGoing && $occurrence->spots_remaining !== null && $occurrence->spots_remaining > 0) {
            $occurrence->decrement('spots_remaining');
        }

        return response()->json(['status' => $attendee->status]);
    }

    public function leave(Request $request, EventOccurrence $occurrence): JsonResponse
    {
        $attendee = EventAttendee::where('event_occurrence_id', $occurrence->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $attendee) {
            return response()->json(['status' => null]);
        }

        $wasGoing = $attendee->status === 'going';
        $attendee->update(['status' => 'cancelled']);

        if ($wasGoing && $occurrence->spots_remaining !== null && $occurrence->capacity !== null && $occurrence->spots_remaining < $occurrence->capacity) {
            $occurrence->increment('spots_remaining');
        }

        return response()->json(['status' => 'cancelled']);
    }
}
