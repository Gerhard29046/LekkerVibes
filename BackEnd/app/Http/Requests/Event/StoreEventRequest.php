<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'community_id' => ['nullable', 'exists:communities,id'],
            'category_id' => ['nullable', 'exists:event_categories,id'],
            'venue_id' => ['nullable', 'exists:venues,id'],
            'is_beginner_friendly' => ['sometimes', 'boolean'],
            'is_free' => ['sometimes', 'boolean'],
            'price_cents' => ['required_if:is_free,false', 'nullable', 'integer', 'min:0'],
            'is_attend_alone_friendly' => ['sometimes', 'boolean'],
            'transport_notes' => ['nullable', 'string', 'max:2000'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'occurrences' => ['required', 'array', 'min:1'],
            'occurrences.*.starts_at' => ['required', 'date'],
            'occurrences.*.ends_at' => ['nullable', 'date', 'after:occurrences.*.starts_at'],
            'occurrences.*.venue_id' => ['nullable', 'exists:venues,id'],
            'occurrences.*.capacity' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
