<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reportable_type' => ['required', Rule::in(['user', 'event', 'community', 'message'])],
            'reportable_id' => ['required', 'integer'],
            'reason' => ['required', Rule::in(['spam', 'harassment', 'inappropriate', 'safety_concern', 'other'])],
            'details' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
