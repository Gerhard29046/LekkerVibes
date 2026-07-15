<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Message\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageRead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $query = Message::withTrashed()->where('conversation_id', $conversation->id)->with('sender');

        if ($request->filled('after_id')) {
            $query->where('id', '>', $request->integer('after_id'));
        }

        $messages = $query->orderBy('created_at')->limit($request->integer('limit', 50))->get();

        return response()->json(['data' => MessageResource::collection($messages)]);
    }

    public function store(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);
        $conversation->touch();

        MessageRead::create([
            'message_id' => $message->id,
            'user_id' => $request->user()->id,
            'read_at' => now(),
        ]);

        return response()->json(['data' => new MessageResource($message->load('sender'))], 201);
    }

    public function destroy(Request $request, Message $message): JsonResponse
    {
        $this->authorize('delete', $message);

        $message->delete();

        return response()->json(['deleted' => true]);
    }
}
