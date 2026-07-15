<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'visibility' => ['sometimes', Rule::in(['public', 'private'])],
            'join_policy' => ['sometimes', Rule::in(['open', 'request', 'invite_only'])],
            'rules' => ['sometimes', 'array'],
            'rules.*.title' => ['required_with:rules', 'string', 'max:255'],
            'rules.*.description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
