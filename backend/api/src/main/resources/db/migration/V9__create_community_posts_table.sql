-- Community posts (all types)
CREATE TABLE community_posts (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    title VARCHAR(500),
    body TEXT,
    image_url TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_community_posts_channel_id ON community_posts(channel_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);

-- Poll options for POLL type posts
CREATE TABLE community_post_options (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_community_post_options_post_id ON community_post_options(post_id);

-- Tracks which user voted on which option (prevents double voting)
CREATE TABLE community_post_votes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES community_post_options(id) ON DELETE CASCADE,
    voted_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

-- Community post likes (separate from video likes)
CREATE TABLE community_post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, post_id)
);
