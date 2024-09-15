<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class LikeToggled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $post;
    public $likesCount;
    public function __construct(Post $post, $likesCount)
    {
        $this->post = $post->load('user');
        $this->likesCount = $likesCount;
    }

    public function broadcastOn()
    {
        return new Channel('posts');
    }

    public function broadcastWith()
{
    return [
        'post' => $this->post,
        'likesCount' => $this->post->likes()->count(), // Обновленное количество лайков
        'userId' => auth()->id(), // Идентификатор пользователя
    ];
}
}
