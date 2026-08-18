# Seamlis — Video Processing Architecture

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Overview

Video processing is the most computationally intensive part of the platform. It must be:

- **Asynchronous** — Never in the HTTP request path
- **Reliable** — Jobs are retried on failure, not silently dropped
- **Observable** — Status visible to creator and to the platform
- **Horizontally scalable** — Multiple workers can process jobs in parallel
- **Storage-efficient** — Raw uploads are temporary; only processed assets persist long-term

---

## 2. Full Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VIDEO UPLOAD & PROCESSING PIPELINE                  │
└─────────────────────────────────────────────────────────────────────────────┘

  Creator Browser/App
         │
         │ 1. POST /api/v1/upload/initiate
         │    → Creates video record (status: UPLOADING)
         │    → Returns pre-signed S3 URL
         ▼
  ┌─────────────────┐
  │   S3 Object     │
  │   Storage       │ ← 2. Client uploads directly via PUT (no API intermediary)
  │   (Raw Bucket)  │
  └────────┬────────┘
           │
           │ 3. POST /api/v1/upload/:videoId/complete
           │    → API validates S3 upload exists
           │    → Updates video status: PROCESSING
           │    → Pushes job to Redis queue
           ▼
  ┌─────────────────┐
  │  Redis Job      │
  │  Queue          │ ← 4. Job: { videoId, rawS3Key, jobId }
  │                 │
  └────────┬────────┘
           │
           │ 5. Processing Worker picks up job
           ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    PROCESSING WORKER                        │
  │                                                             │
  │  5a. Download raw file from S3 to local temp                │
  │  5b. Validate (MIME, extension, size, corruption check)     │
  │  5c. Extract metadata (duration, resolution, framerate)     │
  │  5d. Generate thumbnail frames (3 auto candidates)         │
  │  5e. Transcode to resolution ladder (parallel FFmpeg jobs): │
  │       • 2160p (if source ≥ 2160p)                          │
  │       • 1440p (if source ≥ 1440p)                          │
  │       • 1080p (if source ≥ 1080p)                          │
  │       • 720p                                                │
  │       • 480p                                                │
  │       • 360p                                                │
  │       • 240p                                                │
  │  5f. Package each resolution as HLS (.m3u8 + .ts segments) │
  │  5g. Generate HLS master playlist (multi-bitrate)          │
  │  5h. Upload all segments and playlists to S3 (CDN bucket)  │
  │  5i. Upload thumbnail candidates to S3                      │
  │  5j. Update video status: READY                             │
  │  5k. Create video_assets and video_variants records         │
  │  5l. Dispatch notification: "Video is ready"               │
  │  5m. Clean up temp local files                             │
  │  5n. Mark raw upload for deletion (after 24h grace period)  │
  └─────────────────────────────────────────────────────────────┘
           │
           │ 6. CDN pulls from S3 on first request
           ▼
  ┌─────────────────┐
  │   Cloudflare    │
  │   CDN Edge      │ ← 7. Viewers stream HLS from CDN
  └─────────────────┘
```

---

## 3. Resolution Ladder & Encoding Parameters

### 3.1 Video Codec: H.264 (baseline + future H.265/AV1 for higher resolutions)

| Resolution | Width | Height | Target Bitrate | Max Bitrate | Audio Bitrate | Codec |
|-----------|-------|--------|---------------|-------------|--------------|-------|
| 2160p (4K) | 3840 | 2160 | 20,000 kbps | 25,000 kbps | 192 kbps | H.264/HEVC |
| 1440p (2K) | 2560 | 1440 | 10,000 kbps | 14,000 kbps | 192 kbps | H.264 |
| 1080p | 1920 | 1080 | 4,500 kbps | 6,000 kbps | 128 kbps | H.264 |
| 720p | 1280 | 720 | 2,500 kbps | 3,500 kbps | 128 kbps | H.264 |
| 480p | 854 | 480 | 1,200 kbps | 1,500 kbps | 128 kbps | H.264 |
| 360p | 640 | 360 | 600 kbps | 800 kbps | 96 kbps | H.264 |
| 240p | 426 | 240 | 300 kbps | 400 kbps | 64 kbps | H.264 |

### 3.2 FFmpeg Command Template (1080p example)

```bash
ffmpeg \
  -i input.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -maxrate 6000k \
  -bufsize 12000k \
  -profile:v high \
  -level 4.1 \
  -g 48 \
  -sc_threshold 0 \
  -c:a aac \
  -b:a 128k \
  -ac 2 \
  -ar 48000 \
  -movflags +faststart \
  output_1080p.mp4
```

### 3.3 HLS Packaging (1080p example)

```bash
ffmpeg \
  -i output_1080p.mp4 \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "segments/1080p_%04d.ts" \
  -hls_flags independent_segments \
  1080p.m3u8
```

**HLS segment duration:** 6 seconds (balance between seek performance and segment count)

### 3.4 Master Playlist Template

```
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=4500000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001F,mp4a.40.2"
720p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480,CODECS="avc1.4D001F,mp4a.40.2"
480p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=600000,RESOLUTION=640x360,CODECS="avc1.42001E,mp4a.40.2"
360p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=300000,RESOLUTION=426x240,CODECS="avc1.42000D,mp4a.40.2"
240p/index.m3u8
```

---

## 4. Thumbnail Generation

```bash
# Extract 3 frame candidates at 10%, 50%, 90% of video duration
ffmpeg -i input.mp4 -vf "thumbnail=300,scale=1280:720" \
  -frames:v 1 -ss {10%} thumb_1.jpg
ffmpeg -i input.mp4 -vf "thumbnail=300,scale=1280:720" \
  -frames:v 1 -ss {50%} thumb_2.jpg
ffmpeg -i input.mp4 -vf "thumbnail=300,scale=1280:720" \
  -frames:v 1 -ss {90%} thumb_3.jpg
```

- 3 auto-generated candidates uploaded for creator selection
- Creator can also upload custom thumbnail (PNG/JPG, min 1280×720)
- First auto-thumbnail used as default until creator selects

---

## 5. Upload Validation

### 5.1 Client-side validation (frontend + mobile)

| Check | Rule |
|-------|------|
| File type | Only MP4, MOV, WebM |
| MIME type | `video/mp4`, `video/quicktime`, `video/webm` |
| Max file size | 128 GB |
| Max duration | 12 hours (regular video) |

### 5.2 Server-side validation (processing worker)

| Check | Action on Failure |
|-------|------------------|
| Magic bytes match MIME | Reject, status = FAILED |
| File not corrupt (FFprobe) | Reject, status = FAILED |
| Duration within limits | Reject, status = FAILED |
| Minimum resolution (240p) | Reject, status = FAILED |
| No dangerous container tricks | Reject, status = FAILED |

```bash
# Validate with ffprobe
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,codec_name \
  -of json input.mp4
```

---

## 6. Job Queue Design

### 6.1 Initial Implementation (Redis)

```kotlin
// Job payload
data class VideoProcessingJob(
    val jobId: String,
    val videoId: String,
    val rawStorageKey: String,
    val requestedAt: Instant,
    val attempt: Int = 1
)

// Queue names
const val QUEUE_VIDEO_PROCESSING = "queue:video:processing"
const val QUEUE_VIDEO_PROCESSING_DLQ = "queue:video:processing:dlq"  // Dead letter queue
```

**Job lifecycle:**
```
QUEUED → PICKED_UP → PROCESSING → COMPLETED
                                → FAILED (attempt < 3: retry with backoff)
                                → DEAD (attempt = 3: move to DLQ, alert admin)
```

**Retry backoff:** 30s → 5m → 30m (exponential)

### 6.2 Future Kafka Migration

Job schema is designed as an event payload that maps directly to a Kafka message:

```json
{
  "eventType": "VIDEO_PROCESSING_REQUESTED",
  "videoId": "uuid",
  "rawStorageKey": "videos/raw/uuid/original.mp4",
  "requestedAt": "2026-08-18T09:00:00Z"
}
```

Moving from Redis to Kafka requires only changing the producer/consumer implementation, not the job schema.

---

## 7. Processing Worker Architecture

```kotlin
class VideoProcessingWorker(
    private val queue: JobQueue,
    private val s3: StorageClient,
    private val ffmpeg: FFmpegService,
    private val videoRepository: VideoRepository,
    private val notificationService: NotificationService
) {
    suspend fun run() {
        while (true) {
            val job = queue.dequeue(QUEUE_VIDEO_PROCESSING) ?: continue
            processWithRetry(job)
        }
    }

    private suspend fun processWithRetry(job: VideoProcessingJob) {
        try {
            process(job)
        } catch (e: Exception) {
            if (job.attempt < 3) {
                queue.enqueueDelayed(job.copy(attempt = job.attempt + 1), backoff(job.attempt))
            } else {
                queue.enqueue(QUEUE_VIDEO_PROCESSING_DLQ, job)
                videoRepository.updateStatus(job.videoId, VideoStatus.FAILED)
            }
        }
    }
}
```

---

## 8. Shorts Processing

Shorts follow the same pipeline with differences:

| Property | Long-form | Short |
|----------|-----------|-------|
| Max duration | 12 hours | 60 seconds |
| Aspect ratio | 16:9 | 9:16 (vertical) |
| Resolutions | Full ladder | 1080p, 720p, 480p only |
| Processing priority | Normal | High (faster queue) |
| Thumbnail | Standard | Square crop for feed card |

---

## 9. Storage Layout

```
S3 Bucket: seamlis-media (CDN-enabled)

videos/processed/{videoId}/
├── hls/
│   ├── master.m3u8
│   ├── 2160p/
│   │   ├── index.m3u8
│   │   └── segment_0001.ts ... segment_N.ts
│   ├── 1080p/
│   │   ├── index.m3u8
│   │   └── segment_0001.ts ... segment_N.ts
│   ├── 720p/
│   ├── 480p/
│   ├── 360p/
│   └── 240p/
└── thumbnails/
    ├── auto_001.jpg
    ├── auto_002.jpg
    ├── auto_003.jpg
    └── selected.jpg    ← symlink/copy of whichever is chosen

S3 Bucket: seamlis-raw (private, no CDN)

videos/raw/{videoId}/
└── original.{ext}     ← deleted 24h after successful processing
```

---

## 10. Monitoring

| Metric | Alert Threshold |
|--------|----------------|
| Processing queue depth | > 100 jobs |
| Processing job P99 duration (1080p) | > 10 minutes |
| Failed job rate | > 5% in 1 hour |
| Dead letter queue size | > 0 |
| Worker CPU | > 90% sustained |
| Storage write throughput | Custom baseline |

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [API Architecture ←](./05-api-architecture.md) | Next: [Authentication Architecture →](./07-authentication-architecture.md)*
