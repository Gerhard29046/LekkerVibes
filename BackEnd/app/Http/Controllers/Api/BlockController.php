<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Block\StoreBlockRequest;
use App\Models\Block;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $blocked = $request->user()->blocksInitiated()->with('blocked')->get()->map(fn ($block) => [
            'id' => $block->blocked->id,
            'name' => $block->blocked->name,
            'blocked_at' => $block->created_at,
        ]);

        return response()->json(['data' => $blocked]);
    }

    public function store(StoreBlockRequest $request): JsonResponse
    {
        Block::firstOrCreate([
            'blocker_id' => $request->user()->id,
            'blocked_id' => $request->validated('blocked_id'),
        ]);

        return response()->json(['blocked' => true], 201);
    }

    public function destroy(Request $request, int $blockedId): JsonResponse
    {
        Block::where('blocker_id', $request->user()->id)->where('blocked_id', $blockedId)->delete();

        return response()->json(['blocked' => false]);
    }
}
