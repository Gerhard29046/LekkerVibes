<?php

namespace App\Http\Requests\Block;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'blocked_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ((int) $this->input('blocked_id') === $this->user()->id) {
                $validator->errors()->add('blocked_id', 'You cannot block yourself.');
            }
        });
    }
}
