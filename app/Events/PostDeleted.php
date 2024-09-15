<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class PostDeleted implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $postId;

    public function __construct(Post $post)
    {
        $this->postId = $post->id;
    }

    public function broadcastOn()
    {
        return new Channel('posts');
    }
}
