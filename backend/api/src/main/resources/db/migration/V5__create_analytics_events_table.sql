CREATE TABLE analytics_events (
    id UUID PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    properties JSONB,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_analytics_events_video ON analytics_events(video_id, event_name);
