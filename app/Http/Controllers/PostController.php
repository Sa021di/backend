<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;

    use App\Models\Post;
    use App\Models\Like;
    use Illuminate\Http\Request;
    use App\Events\PostCreated;
    use App\Events\PostUpdated;
    use App\Events\LikeToggled;
    use App\Events\PostDeleted;
    use Illuminate\Support\Facades\Auth;
    use App\Models\Bookmark;

    class PostController extends Controller
    {

        // public function index()
        // {
        //     $perPage = 10; // Number of posts per page
        //     $posts = Post::with('user')
        //                 ->withCount('likes')
        //                 ->paginate($perPage);

        //     $userLikes = Like::where('user_id', Auth::id())->pluck('post_id');

        //     return response()->json([
        //         'posts' => $posts->items(), // Array of posts for the current page
        //         'likedPosts' => $userLikes,
        //         'currentPage' => $posts->currentPage(),
        //         'lastPage' => $posts->lastPage(),
        //     ]);
        // }   
        public function index()
        {
            $posts = Post::with('user')
            ->withCount('likes')
            ->orderBy('created_at', 'desc') // Сортировка по дате создания, начиная с самого нового
            ->get();
            $userLikes = Like::where('user_id', Auth::id())->pluck('post_id');
        
            // foreach ($posts as $post) {
            //     $post->userHasLiked = in_array($post->id, $userLikes->toArray());
            // }

            return response()->json([
                'posts' => $posts,
                'likedPosts' => $userLikes,
            ]);


        }


        public function store(Request $request)
        {
            $validatedData = $request->validate([
                'body' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10000',
            ]);
        
            $userId = Auth::id();
            if (!$userId) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
        
            $imagePath = $request->hasFile('image') ? $request->file('image')->store('images', 'public') : null;
        
            $post = Post::create([
                'body' => $validatedData['body'],
                'user_id' => $userId,
                'image' => $imagePath,
            ]);
        
            $post->load('user'); 
            Log::info('Broadcasting PostCreated event', ['post' => $post]);
            broadcast(new PostCreated($post))->toOthers();
        
            return response()->json($post, 201);
        }

        public function toggleLike(Request $request, $postId)
        {
            $post = Post::findOrFail($postId);
            $user = $request->user();
        
            if ($post->likes()->where('user_id', $user->id)->exists()) {
                $post->likes()->where('user_id', $user->id)->delete();
            } else {
                $post->likes()->create(['user_id' => $user->id]);
            }
        
            $likesCount = $post->likes()->count();
        
            broadcast(new LikeToggled($post, $likesCount))->toOthers();
        
            return response()->json([
                'message' => 'Like toggled',
                'likesCount' => $likesCount,
            ]);
        }

        

    public function show($id)
    {
        $post = Post::findOrFail($id);
        $likesCount = $post->likesCount();

        return response()->json([
            'post' => $post,
            'likes_count' => $likesCount,
        ]);
    }

    public function bookmark(Post $post)
    {
        $user = auth()->user();
    
        $existingBookmark = Bookmark::where('user_id', $user->id)
                                    ->where('post_id', $post->id)
                                    ->first();
    
        if (!$existingBookmark) {
            try {
                Bookmark::create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                ]);
                return response()->json(['message' => 'Post bookmarked'], 200);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Failed to bookmark post'], 500);
            }
        }
    
        return response()->json(['message' => 'Post already bookmarked'], 200);
    }
    
    public function unbookmark(Post $post)
    {
        $user = auth()->user();
    
        $deleted = Bookmark::where('user_id', $user->id)
                           ->where('post_id', $post->id)
                           ->delete();
    
        if ($deleted) {
            return response()->json(['message' => 'Post unbookmarked'], 200);
        }
    
        return response()->json(['message' => 'Post not found in bookmarks'], 404);
    }

    public function getBookmarkedPosts()
    {
        $posts = auth()->user()->bookmarkedPosts()->with('user')->get();
        return response()->json(['posts' => $posts]);
    }



    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'body' => 'required|string|max:255',
        ]);
        
    
        $post = Post::findOrFail($id);
        $post->body = $validatedData['body'];
    
        if ($post->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
       
        $post->save();
        
        broadcast(new PostUpdated($post))->toOthers();
    
        return response()->json(['post' => $post]);
    }

    

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
    
        if ($post->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
    
        $post->delete();
    
        // Broadcast post deletion event
        broadcast(new PostDeleted($post))->toOthers();
    
        return response()->json(['message' => 'Post deleted']);
    }

    }
