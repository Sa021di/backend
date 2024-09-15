<?php

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Route;
    use App\Http\Controllers\AuthController;
    use App\Http\Controllers\PostController;
    use App\Http\Controllers\CommentController;
    /*
    |--------------------------------------------------------------------------
    | API Routes
    |--------------------------------------------------------------------------
    |
    | Here is where you can register API routes for your application. These
    | routes are loaded by the RouteServiceProvider and all of them will
    | be assigned to the "api" middleware group. Make something great!
    |
    */

    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);



    Route::get('/posts', [PostController::class, 'index']);

    // Route to create a new post
    Route::post('/posts', [PostController::class, 'store']);

    Route::post('/posts/{post}/like', [PostController::class, 'toggleLike']);
    Route::post('/posts/{post}/unlike', [PostController::class, 'toggleLike']);

    Route::middleware('auth:api')->get('/user', [AuthController::class, 'me']);
    // api.php
    Route::middleware('auth:api')->post('/user/update', [AuthController::class, 'updateProfile']);

    Route::middleware('auth:api')->group(function () {
        Route::get('posts/{postId}/comments', [CommentController::class, 'index']);
        Route::post('posts/{postId}/comments', [CommentController::class, 'store']);

        Route::post('posts/{post}/bookmark',  [PostController::class, 'bookmark']);
        Route::post('posts/{post}/unbookmark', [PostController::class, 'unbookmark']);
        Route::get('bookmarked-posts',  [PostController::class, 'getBookmarkedPosts']);
        Route::put('/posts/{post}', [PostController::class, 'update']);
        Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    });
    
