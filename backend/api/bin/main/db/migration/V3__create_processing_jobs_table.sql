CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY,
    video_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    worker_log TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_processing_jobs_video_id__id FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);
