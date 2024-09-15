<?php

namespace App\Http\Controllers;
// app/Http/Controllers/CommentController.php

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\CommentCreated;

class CommentController extends Controller
{
    public function store(Request $request, $postId)
    {
        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment = Comment::create([
            'post_id' => $postId,
            'user_id' => auth()->id(),
            'body' => $validated['body'],
        ]);

        broadcast(new CommentCreated($comment))->toOthers();

        return response()->json(['comment' => $comment]);
    }

    public function index($postId)
    {
        $comments = Comment::where('post_id', $postId)->with('user')->get();
        return response()->json(['comments' => $comments]);
    }
}
