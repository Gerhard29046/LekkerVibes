<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransportPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'has_car' => ['sometimes', 'boolean'],
            'uses_public_transport' => ['sometimes', 'boolean'],
            'uses_rideshare' => ['sometimes', 'boolean'],
            'walks_cycles' => ['sometimes', 'boolean'],
            'max_travel_minutes' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:600'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
