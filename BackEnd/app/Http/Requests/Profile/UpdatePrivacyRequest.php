<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePrivacyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'profile_visibility' => ['sometimes', Rule::in(['public', 'members_only', 'private'])],
            'show_location' => ['sometimes', 'boolean'],
            'show_age' => ['sometimes', 'boolean'],
            'show_joined_communities' => ['sometimes', 'boolean'],
        ];
    }
}
