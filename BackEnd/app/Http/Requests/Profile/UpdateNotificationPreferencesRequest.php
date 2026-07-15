<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email_enabled' => ['sometimes', 'boolean'],
            'push_enabled' => ['sometimes', 'boolean'],
            'event_reminders' => ['sometimes', 'boolean'],
            'community_updates' => ['sometimes', 'boolean'],
            'messages' => ['sometimes', 'boolean'],
            'marketing' => ['sometimes', 'boolean'],
        ];
    }
}
