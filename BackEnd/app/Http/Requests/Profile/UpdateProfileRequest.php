<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'display_name' => ['sometimes', 'string', 'max:255'],
            'username' => [
                'sometimes', 'string', 'max:255', 'alpha_dash',
                Rule::unique('user_profiles', 'username')->ignore($this->user()->profile?->id),
            ],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'pronouns' => ['sometimes', 'nullable', 'string', 'max:50'],
            'age_range' => ['sometimes', 'nullable', Rule::in(['18-24', '25-34', '35-44', '45-54', '55+'])],
            'location_id' => ['sometimes', 'nullable', 'exists:locations,id'],
            'alcohol_free_pref' => ['sometimes', 'boolean'],
            'family_friendly_pref' => ['sometimes', 'boolean'],
        ];
    }
}
