<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ── Public Routes ──────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register',      [AuthController::class, 'register']);
    Route::post('login',         [AuthController::class, 'login']);
    Route::post('google',        [AuthController::class, 'googleLogin']);
    Route::post('google-config', [AuthController::class, 'saveGoogleConfig']);
});

Route::get('rooms',                          [RoomController::class, 'index']);
Route::get('rooms/{room}',                   [RoomController::class, 'show']);
Route::get('rooms/{room}/availability',      [RoomController::class, 'availability']);
Route::get('rooms/{room}/display',           [BookingController::class, 'roomDisplay']);
Route::post('rooms/{room}/quick-book',        [BookingController::class, 'quickBook']);
Route::post('bookings/{booking}/check-in',    [BookingController::class, 'checkIn']);

// ── Authenticated Routes ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth & Users
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);
    Route::get('users',        [AuthController::class, 'users']);

    // Profile
    Route::get('profile',          [ProfileController::class, 'show']);
    Route::put('profile',          [ProfileController::class, 'update']);
    Route::post('profile/avatar',  [ProfileController::class, 'uploadAvatar']);

    // Bookings (User)
    Route::get('bookings',                          [BookingController::class, 'index']);
    Route::post('bookings',                         [BookingController::class, 'store']);
    Route::get('bookings/{booking}',                [BookingController::class, 'show']);
    Route::patch('bookings/{booking}/cancel',       [BookingController::class, 'cancel']);
    Route::post('bookings/{booking}/upload-file',   [BookingController::class, 'uploadFile']);
    Route::delete('bookings/{booking}/delete-file', [BookingController::class, 'deleteFile']);
    Route::put('bookings/{booking}/attendees',      [BookingController::class, 'updateAttendees']);

    // ── Admin Routes ───────────────────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Room CRUD (admin)
        Route::post('rooms',              [RoomController::class, 'store']);
        Route::put('rooms/{room}',        [RoomController::class, 'update']);
        Route::post('rooms/{room}',       [RoomController::class, 'update']); // for multipart/form-data with _method
        Route::delete('rooms/{room}',     [RoomController::class, 'destroy']);

        // Booking management
        Route::get('bookings',                          [BookingController::class, 'adminIndex']);
        Route::get('bookings/export',                   [BookingController::class, 'export']);
        Route::patch('bookings/{booking}/status',       [BookingController::class, 'updateStatus']);

        // User management
        Route::get('users',                             [UserController::class, 'index']);
        Route::get('users/{id}',                        [UserController::class, 'show']);
        Route::put('users/{user}',                      [UserController::class, 'update']);
        Route::delete('users/{user}',                   [UserController::class, 'destroy']);
    });
});
