CREATE TABLE video_likes (
    id UUID PRIMARY KEY,
    video_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_video_likes_video_id FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    CONSTRAINT fk_video_likes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_video_like UNIQUE (video_id, user_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY,
    video_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_comments_video_id FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent_id FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    subscriber_id UUID NOT NULL,
    channel_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_subscriptions_subscriber_id FOREIGN KEY (subscriber_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_channel_id FOREIGN KEY (channel_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_subscription UNIQUE (subscriber_id, channel_id)
);

CREATE TABLE watch_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    video_id UUID NOT NULL,
    watched_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_watch_history_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_watch_history_video_id FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    CONSTRAINT uq_watch_history UNIQUE (user_id, video_id)
);
