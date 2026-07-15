<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Location\StoreSavedAreaRequest;
use App\Http\Resources\LocationResource;
use App\Http\Resources\SavedAreaResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Location::query();

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('parent_id')) {
            $query->where('parent_id', $request->integer('parent_id'));
        }

        if ($request->boolean('popular')) {
            $query->where('is_popular', true);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search').'%');
        }

        $locations = $query->orderBy('is_popular', 'desc')->orderBy('name')->paginate(
            $request->integer('per_page', 30)
        );

        return response()->json([
            'data' => LocationResource::collection($locations->items()),
            'meta' => [
                'current_page' => $locations->currentPage(),
                'last_page' => $locations->lastPage(),
                'total' => $locations->total(),
            ],
        ]);
    }

    public function show(Location $location): JsonResponse
    {
        $location->load('children');

        return response()->json(['data' => new LocationResource($location)]);
    }

    public function savedAreas(Request $request): JsonResponse
    {
        $areas = $request->user()->savedAreas()->with('location')->get();

        return response()->json(['data' => SavedAreaResource::collection($areas)]);
    }

    public function storeSavedArea(StoreSavedAreaRequest $request): JsonResponse
    {
        $area = $request->user()->savedAreas()->create($request->validated());

        return response()->json(['data' => new SavedAreaResource($area->load('location'))], 201);
    }

    public function destroySavedArea(Request $request, int $savedArea): JsonResponse
    {
        $deleted = $request->user()->savedAreas()->where('id', $savedArea)->delete();

        return response()->json(['deleted' => (bool) $deleted]);
    }
}
