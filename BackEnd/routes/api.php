<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\EventAttendanceController;
use App\Http\Controllers\Api\EventCategoryController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\InterestController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('profile')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [ProfileController::class, 'show']);
    Route::put('/', [ProfileController::class, 'update']);
    Route::put('/privacy', [ProfileController::class, 'updatePrivacy']);
    Route::put('/notifications', [ProfileController::class, 'updateNotificationPreferences']);
    Route::put('/transport', [ProfileController::class, 'updateTransportPreferences']);
    Route::put('/interests', [ProfileController::class, 'syncInterests']);
});

Route::prefix('locations')->group(function () {
    Route::get('/', [LocationController::class, 'index']);
    Route::get('/{location}', [LocationController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me/saved-areas', [LocationController::class, 'savedAreas']);
        Route::post('/me/saved-areas', [LocationController::class, 'storeSavedArea']);
        Route::delete('/me/saved-areas/{savedArea}', [LocationController::class, 'destroySavedArea']);
    });
});

Route::get('/interests', [InterestController::class, 'index']);
Route::get('/event-categories', [EventCategoryController::class, 'index']);

Route::prefix('events')->group(function () {
    Route::get('/', [EventController::class, 'index']);
    Route::get('/{event}', [EventController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [EventController::class, 'store']);
        Route::put('/{event}', [EventController::class, 'update']);
        Route::delete('/{event}', [EventController::class, 'destroy']);
        Route::post('/{event}/save', [EventController::class, 'save']);
        Route::delete('/{event}/save', [EventController::class, 'unsave']);
        Route::post('/occurrences/{occurrence}/join', [EventAttendanceController::class, 'join']);
        Route::post('/occurrences/{occurrence}/leave', [EventAttendanceController::class, 'leave']);
    });
});

// /api/activities is a product-facing alias for the same event resource.
Route::prefix('activities')->group(function () {
    Route::get('/', [EventController::class, 'index']);
    Route::get('/{event}', [EventController::class, 'show']);
});
