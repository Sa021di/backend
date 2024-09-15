<?php

// PostUpdated.php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;


class PostUpdated implements ShouldBroadcast
{
    use SerializesModels;

    public $post;

    public function __construct(Post $post)
    {
        $this->post = $post->load('user');
    }

    public function broadcastOn()
    {
        return new Channel('posts');
    }
}
