<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\StoreReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->is_admin, 403);

        $reports = Report::with('reporter')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->latest()
            ->paginate($request->integer('per_page', 30));

        return response()->json(['data' => ReportResource::collection($reports->items())]);
    }

    public function store(StoreReportRequest $request): JsonResponse
    {
        $report = Report::create([
            ...$request->validated(),
            'reporter_id' => $request->user()->id,
            'status' => 'open',
        ]);

        return response()->json(['data' => new ReportResource($report)], 201);
    }

    public function resolve(Request $request, Report $report): JsonResponse
    {
        abort_unless($request->user()->is_admin, 403);

        $report->update(['status' => 'resolved', 'resolved_by' => $request->user()->id, 'resolved_at' => now()]);

        return response()->json(['data' => new ReportResource($report->fresh())]);
    }

    public function dismiss(Request $request, Report $report): JsonResponse
    {
        abort_unless($request->user()->is_admin, 403);

        $report->update(['status' => 'dismissed', 'resolved_by' => $request->user()->id, 'resolved_at' => now()]);

        return response()->json(['data' => new ReportResource($report->fresh())]);
    }
}
