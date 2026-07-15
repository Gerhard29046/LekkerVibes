<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityRequest;
use App\Http\Requests\Community\UpdateCommunityRequest;
use App\Http\Resources\CommunityResource;
use App\Models\Community;
use App\Models\CommunityMember;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\WelcomeGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommunityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $query = Community::query()
            ->with(['location', 'coverMedia', 'logoMedia'])
            ->where('status', 'active')
            ->where('visibility', 'public');

        if ($request->boolean('mine') && $user) {
            $query = Community::query()->with(['location', 'coverMedia', 'logoMedia'])
                ->whereHas('members', fn ($q) => $q->where('user_id', $user->id)->where('status', 'active'));
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->integer('location_id'));
        }

        if ($request->filled('join_policy')) {
            $query->where('join_policy', $request->input('join_policy'));
        }

        if ($request->filled('search')) {
            $search = '%'.$request->string('search').'%';
            $query->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('description', 'like', $search));
        }

        if ($user) {
            $query->with(['members' => fn ($q) => $q->where('user_id', $user->id)]);
        }

        $communities = $query->orderByDesc('trending_score')->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => CommunityResource::collection($communities->items()),
            'meta' => [
                'current_page' => $communities->currentPage(),
                'last_page' => $communities->lastPage(),
                'total' => $communities->total(),
            ],
        ]);
    }

    public function show(Request $request, Community $community): JsonResponse
    {
        $user = $request->user('sanctum');

        $community->load(['location', 'coverMedia', 'logoMedia', 'creator', 'rules', 'images.media']);

        if ($user) {
            $community->load(['members' => fn ($q) => $q->where('user_id', $user->id)]);
        }

        return response()->json(['data' => new CommunityResource($community)]);
    }

    public function store(StoreCommunityRequest $request): JsonResponse
    {
        $data = $request->validated();
        $rules = $data['rules'] ?? [];
        unset($data['rules']);

        $community = DB::transaction(function () use ($data, $rules, $request) {
            $community = Community::create([
                ...$data,
                'creator_id' => $request->user()->id,
                'slug' => Str::slug($data['name']).'-'.Str::random(6),
                'status' => 'active',
                'member_count' => 1,
            ]);

            CommunityMember::create([
                'community_id' => $community->id,
                'user_id' => $request->user()->id,
                'role' => 'organiser',
                'status' => 'active',
                'joined_at' => now(),
            ]);

            foreach ($rules as $index => $rule) {
                $community->rules()->create([
                    'position' => $index + 1,
                    'title' => $rule['title'],
                    'description' => $rule['description'] ?? null,
                ]);
            }

            $conversation = Conversation::create([
                'type' => 'welcome_group',
                'community_id' => $community->id,
                'title' => 'Welcome to '.$community->name,
                'created_by' => $request->user()->id,
            ]);
            WelcomeGroup::create([
                'community_id' => $community->id,
                'conversation_id' => $conversation->id,
            ]);
            ConversationMember::create([
                'conversation_id' => $conversation->id,
                'user_id' => $request->user()->id,
                'role' => 'admin',
                'joined_at' => now(),
            ]);

            return $community;
        });

        return $this->show($request, $community->fresh());
    }

    public function update(UpdateCommunityRequest $request, Community $community): JsonResponse
    {
        $this->authorize('update', $community);

        $community->update($request->validated());

        return $this->show($request, $community->fresh());
    }

    public function destroy(Request $request, Community $community): JsonResponse
    {
        $this->authorize('delete', $community);

        $community->delete();

        return response()->json(['deleted' => true]);
    }
}
