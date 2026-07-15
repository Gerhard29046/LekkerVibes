<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InterestResource;
use App\Models\Interest;
use Illuminate\Http\JsonResponse;

class InterestController extends Controller
{
    public function index(): JsonResponse
    {
        $interests = Interest::orderBy('category')->orderBy('name')->get();

        return response()->json(['data' => InterestResource::collection($interests)]);
    }
}
