<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class SyncInterestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'interest_ids' => ['required', 'array'],
            'interest_ids.*' => ['integer', 'exists:interests,id'],
        ];
    }
}
