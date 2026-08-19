CREATE TABLE livestreams (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    stream_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    viewer_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE live_chat_messages (
    id UUID PRIMARY KEY,
    livestream_id UUID NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_livestreams_channel_id ON livestreams(channel_id);
CREATE INDEX idx_livestreams_stream_key ON livestreams(stream_key);
CREATE INDEX idx_live_chat_messages_livestream_id ON live_chat_messages(livestream_id);
