<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Upload\StoreUploadRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function store(StoreUploadRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $path = $file->storeAs(
            'uploads/'.$request->user()->id,
            Str::uuid().'.'.$file->getClientOriginalExtension(),
            'public'
        );

        [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

        $media = Media::create([
            'uploader_id' => $request->user()->id,
            'disk' => 'public',
            'path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'width' => $width,
            'height' => $height,
        ]);

        return response()->json(['data' => new MediaResource($media)], 201);
    }
}
