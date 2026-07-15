<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'community_id' => ['sometimes', 'nullable', 'exists:communities,id'],
            'category_id' => ['sometimes', 'nullable', 'exists:event_categories,id'],
            'venue_id' => ['sometimes', 'nullable', 'exists:venues,id'],
            'is_beginner_friendly' => ['sometimes', 'boolean'],
            'is_free' => ['sometimes', 'boolean'],
            'price_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_attend_alone_friendly' => ['sometimes', 'boolean'],
            'transport_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'cancelled', 'completed'])],
        ];
    }
}
