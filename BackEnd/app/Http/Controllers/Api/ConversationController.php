<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageRead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->with([
                'community', 'event',
                'messages' => fn ($q) => $q->latest()->limit(1),
                'members' => fn ($q) => $q->where('user_id', $user->id),
            ])
            ->orderByDesc('updated_at')
            ->get();

        $conversations->each(function (Conversation $conversation) use ($user) {
            $lastReadAt = MessageRead::where('user_id', $user->id)
                ->whereIn('message_id', $conversation->messages()->pluck('id'))
                ->max('read_at');

            $membership = $conversation->members->first();
            $since = $lastReadAt ?? $membership?->joined_at ?? $conversation->created_at;

            $conversation->unread_count = Message::where('conversation_id', $conversation->id)
                ->where('created_at', '>', $since)
                ->where('sender_id', '!=', $user->id)
                ->count();
        });

        return response()->json(['data' => ConversationResource::collection($conversations)]);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $conversation->load(['community', 'event', 'members.user']);

        return response()->json(['data' => new ConversationResource($conversation)]);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $user = $request->user();
        $unreadIds = Message::where('conversation_id', $conversation->id)
            ->whereDoesntHave('reads', fn ($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        foreach ($unreadIds as $messageId) {
            MessageRead::firstOrCreate([
                'message_id' => $messageId,
                'user_id' => $user->id,
            ], ['read_at' => now()]);
        }

        return response()->json(['marked_read' => $unreadIds->count()]);
    }
}
