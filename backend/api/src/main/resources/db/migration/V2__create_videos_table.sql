CREATE TABLE videos (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    original_video_key VARCHAR(512),
    processed_video_key VARCHAR(512),
    thumbnail_url VARCHAR(512),
    uploader_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_videos_uploader_id__id FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);
