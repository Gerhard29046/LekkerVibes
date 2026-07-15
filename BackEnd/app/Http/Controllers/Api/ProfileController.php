<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\SyncInterestsRequest;
use App\Http\Requests\Profile\UpdateNotificationPreferencesRequest;
use App\Http\Requests\Profile\UpdatePrivacyRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UpdateTransportPreferencesRequest;
use App\Http\Resources\ProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'profile.location', 'profile.avatarMedia', 'profile.coverMedia',
            'interests', 'privacySetting', 'notificationPreference', 'transportPreference',
        ]);

        return response()->json(['profile' => new ProfileResource($user)]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->profile()->update($request->validated());

        return $this->show($request);
    }

    public function updatePrivacy(UpdatePrivacyRequest $request): JsonResponse
    {
        $request->user()->privacySetting()->update($request->validated());

        return $this->show($request);
    }

    public function updateNotificationPreferences(UpdateNotificationPreferencesRequest $request): JsonResponse
    {
        $request->user()->notificationPreference()->update($request->validated());

        return $this->show($request);
    }

    public function updateTransportPreferences(UpdateTransportPreferencesRequest $request): JsonResponse
    {
        $request->user()->transportPreference()->update($request->validated());

        return $this->show($request);
    }

    public function syncInterests(SyncInterestsRequest $request): JsonResponse
    {
        $request->user()->interests()->sync($request->validated('interest_ids'));

        return $this->show($request);
    }
}
