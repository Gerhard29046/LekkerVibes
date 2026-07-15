<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'location_id' => ['sometimes', 'nullable', 'exists:locations,id'],
            'visibility' => ['sometimes', Rule::in(['public', 'private'])],
            'join_policy' => ['sometimes', Rule::in(['open', 'request', 'invite_only'])],
            'status' => ['sometimes', Rule::in(['active', 'archived'])],
        ];
    }
}
