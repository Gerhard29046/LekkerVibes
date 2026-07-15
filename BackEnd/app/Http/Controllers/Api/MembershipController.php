<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\RequestMembershipRequest;
use App\Http\Resources\CommunityMemberResource;
use App\Http\Resources\MembershipRequestResource;
use App\Models\Community;
use App\Models\CommunityMember;
use App\Models\ConversationMember;
use App\Models\MembershipRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MembershipController extends Controller
{
    public function join(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();

        $existing = CommunityMember::where('community_id', $community->id)->where('user_id', $user->id)->first();
        if ($existing && $existing->status === 'active') {
            return response()->json(['status' => 'active', 'role' => $existing->role]);
        }

        if ($community->join_policy === 'invite_only') {
            throw ValidationException::withMessages(['join_policy' => ['This community is invite-only.']]);
        }

        if ($community->join_policy === 'request') {
            $pending = MembershipRequest::where('community_id', $community->id)
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->first();

            if (! $pending) {
                MembershipRequest::create([
                    'community_id' => $community->id,
                    'user_id' => $user->id,
                    'message' => $request->input('message'),
                    'status' => 'pending',
                ]);
            }

            return response()->json(['status' => 'request_pending']);
        }

        // join_policy === 'open'
        if ($existing) {
            $existing->update(['status' => 'active', 'joined_at' => now()]);
        } else {
            CommunityMember::create([
                'community_id' => $community->id,
                'user_id' => $user->id,
                'role' => 'member',
                'status' => 'active',
                'joined_at' => now(),
            ]);
        }
        $community->increment('member_count');
        $this->addToWelcomeGroup($community, $user->id);

        return response()->json(['status' => 'active', 'role' => 'member']);
    }

    public function leave(Request $request, Community $community): JsonResponse
    {
        $deleted = CommunityMember::where('community_id', $community->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->delete();

        if ($deleted && $community->member_count > 0) {
            $community->decrement('member_count');
        }

        return response()->json(['status' => 'left']);
    }

    public function members(Request $request, Community $community): JsonResponse
    {
        $members = $community->members()->where('status', 'active')->with('user')->paginate(
            $request->integer('per_page', 30)
        );

        return response()->json(['data' => CommunityMemberResource::collection($members->items())]);
    }

    public function membershipRequests(Request $request, Community $community): JsonResponse
    {
        $this->authorize('manageMembers', $community);

        $requests = $community->membershipRequests()->where('status', 'pending')->with('user')->get();

        return response()->json(['data' => MembershipRequestResource::collection($requests)]);
    }

    public function approveMembershipRequest(Request $request, Community $community, MembershipRequest $membershipRequest): JsonResponse
    {
        $this->authorize('manageMembers', $community);

        $membershipRequest->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        CommunityMember::updateOrCreate(
            ['community_id' => $community->id, 'user_id' => $membershipRequest->user_id],
            ['role' => 'member', 'status' => 'active', 'joined_at' => now()]
        );
        $community->increment('member_count');
        $this->addToWelcomeGroup($community, $membershipRequest->user_id);

        return response()->json(['data' => new MembershipRequestResource($membershipRequest->fresh())]);
    }

    public function rejectMembershipRequest(Request $request, Community $community, MembershipRequest $membershipRequest): JsonResponse
    {
        $this->authorize('manageMembers', $community);

        $membershipRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['data' => new MembershipRequestResource($membershipRequest->fresh())]);
    }

    private function addToWelcomeGroup(Community $community, int $userId): void
    {
        $welcomeGroup = $community->conversations()->where('type', 'welcome_group')->first();

        if ($welcomeGroup) {
            ConversationMember::firstOrCreate(
                ['conversation_id' => $welcomeGroup->id, 'user_id' => $userId],
                ['role' => 'member', 'joined_at' => now()]
            );
        }
    }
}
