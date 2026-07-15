<?php

namespace App\Http\Requests\Location;

use Illuminate\Foundation\Http\FormRequest;

class StoreSavedAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_id' => ['required', 'exists:locations,id'],
            'label' => ['nullable', 'string', 'max:255'],
            'radius_km' => ['nullable', 'integer', 'min:1', 'max:200'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
