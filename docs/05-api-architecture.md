# Seamlis — API Architecture

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Design Principles

- All endpoints versioned under `/api/v1/`
- RESTful semantics (HTTP verbs, status codes)
- Consistent error response format
- Cursor-based pagination for feeds and large lists
- JWT authentication on protected endpoints
- Rate limiting on all public endpoints
- Every response includes a `requestId` for tracing

---

## 2. Standard Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_01j5xyz",
    "timestamp": "2026-08-18T09:00:00Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "nextCursor": "eyJpZCI6ImFiYyJ9",
    "hasMore": true,
    "total": null
  },
  "meta": {
    "requestId": "req_01j5xyz"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "The requested video was not found.",
    "details": null
  },
  "meta": {
    "requestId": "req_01j5xyz"
  }
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid authentication |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `VIDEO_NOT_FOUND` | 404 | Specific resource error |
| `CHANNEL_HANDLE_TAKEN` | 409 | Conflict |
| `EMAIL_ALREADY_EXISTS` | 409 | Conflict |

---

## 3. Authentication & Authorization

| Header | Value | Required For |
|--------|-------|-------------|
| `Authorization` | `Bearer {access_token}` | Protected endpoints |
| `X-Refresh-Token` | `{refresh_token}` | Token refresh endpoint |

**Token specs:**
- Access token: JWT, HS256 signed, 15-minute TTL
- Refresh token: Opaque random string, 30-day TTL, stored in Redis + HttpOnly cookie

---

## 4. Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Public (unauthenticated) | 60 req | 1 minute |
| Authenticated viewer | 300 req | 1 minute |
| Authenticated creator | 600 req | 1 minute |
| Admin | 1200 req | 1 minute |
| Upload initiation | 10 req | 1 hour |
| Comment post | 30 req | 1 hour |
| Like/Unlike | 60 req | 1 minute |

Rate limit headers returned on all responses:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1724000460
```

---

## 5. API Endpoint Catalog

### 5.1 Auth Endpoints

```
POST   /api/v1/auth/register           Public     Register new account
POST   /api/v1/auth/login              Public     Login, returns tokens
POST   /api/v1/auth/logout             Auth       Revoke refresh token
POST   /api/v1/auth/refresh            Public     Exchange refresh → access token
POST   /api/v1/auth/verify-email       Public     Verify email with token
POST   /api/v1/auth/forgot-password    Public     Send reset email
POST   /api/v1/auth/reset-password     Public     Reset password with token
GET    /api/v1/auth/me                 Auth       Get current user
```

**POST /api/v1/auth/register**

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "Jane Creator"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "VIEWER" },
    "message": "Verification email sent."
  }
}
```

---

**POST /api/v1/auth/login**

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 900,
    "user": { "id": "...", "role": "CREATOR", "profile": {...} }
  }
}
```
*(refresh token set as HttpOnly cookie)*

---

### 5.2 User & Profile Endpoints

```
GET    /api/v1/users/me                        Auth       Current user profile
PUT    /api/v1/users/me                        Auth       Update profile
PUT    /api/v1/users/me/avatar                 Auth       Upload avatar
PUT    /api/v1/users/me/password               Auth       Change password
DELETE /api/v1/users/me                        Auth       Delete account
GET    /api/v1/users/:userId                   Public     Get public profile
GET    /api/v1/users/me/notifications          Auth       List notifications
PUT    /api/v1/users/me/notifications/:id/read Auth       Mark notification read
PUT    /api/v1/users/me/notifications/read-all Auth       Mark all read
GET    /api/v1/users/me/watch-history          Auth       Watch history (paginated)
DELETE /api/v1/users/me/watch-history          Auth       Clear history
GET    /api/v1/users/me/watch-later            Auth       Watch later list
POST   /api/v1/users/me/watch-later            Auth       Add to watch later
DELETE /api/v1/users/me/watch-later/:videoId   Auth       Remove from watch later
```

---

### 5.3 Channel Endpoints

```
POST   /api/v1/channels                              Auth (no channel)  Create channel
GET    /api/v1/channels/:handle                      Public             Get channel by handle
PUT    /api/v1/channels/:channelId                   Auth (owner)       Update channel
PUT    /api/v1/channels/:channelId/avatar            Auth (owner)       Upload avatar
PUT    /api/v1/channels/:channelId/banner            Auth (owner)       Upload banner
GET    /api/v1/channels/:channelId/videos            Public             Channel videos (paginated)
GET    /api/v1/channels/:channelId/shorts            Public             Channel shorts (paginated)
GET    /api/v1/channels/:channelId/playlists         Public             Channel playlists
GET    /api/v1/channels/:channelId/community         Public             Community posts (paginated)
POST   /api/v1/channels/:channelId/subscribe         Auth               Subscribe
DELETE /api/v1/channels/:channelId/subscribe         Auth               Unsubscribe
GET    /api/v1/channels/:channelId/subscribers       Auth (owner/admin) Subscriber list
GET    /api/v1/users/me/subscriptions                Auth               My subscriptions
```

**GET /api/v1/channels/:handle**

Response (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "handle": "seamliscreator",
    "name": "Seamlis Creator",
    "description": "...",
    "avatarUrl": "https://cdn.seamlis.com/...",
    "bannerUrl": "https://cdn.seamlis.com/...",
    "subscriberCount": 12500,
    "videoCount": 48,
    "totalViews": 987654,
    "isVerified": false,
    "isSubscribed": true,
    "notifyNewVideos": true,
    "links": []
  }
}
```

---

### 5.4 Video Endpoints

```
GET    /api/v1/videos/:videoId                  Public (some)    Get video details
GET    /api/v1/videos/:videoId/playback         Auth (some)      Get playback URLs
POST   /api/v1/videos/:videoId/view             Auth/Anon        Record view event
GET    /api/v1/videos/:videoId/likes            Auth             Like status for current user
POST   /api/v1/videos/:videoId/like             Auth             Like video
POST   /api/v1/videos/:videoId/dislike          Auth             Dislike video
DELETE /api/v1/videos/:videoId/like             Auth             Remove like/dislike
PUT    /api/v1/videos/:videoId                  Auth (owner)     Update video metadata
DELETE /api/v1/videos/:videoId                  Auth (owner)     Delete video
GET    /api/v1/videos/:videoId/comments         Public           Get comments (paginated)
POST   /api/v1/videos/:videoId/comments         Auth             Post comment
```

**GET /api/v1/videos/:videoId/playback**

Response (200):
```json
{
  "success": true,
  "data": {
    "masterPlaylistUrl": "https://cdn.seamlis.com/videos/abc123/hls/master.m3u8",
    "thumbnailUrl": "https://cdn.seamlis.com/videos/abc123/thumbnails/selected.jpg",
    "duration": 1234,
    "variants": [
      { "resolution": "1080p", "bitrate": 4000 },
      { "resolution": "720p",  "bitrate": 2500 },
      { "resolution": "480p",  "bitrate": 1200 }
    ],
    "captionsUrl": null,
    "resumeAt": 120
  }
}
```

---

### 5.5 Upload Endpoints

```
POST   /api/v1/upload/initiate          Auth (creator)    Create video record, get pre-signed URL
POST   /api/v1/upload/:videoId/complete Auth (creator)    Notify upload complete, trigger processing
GET    /api/v1/upload/:videoId/status   Auth (creator)    Check processing status
```

**POST /api/v1/upload/initiate**

Request:
```json
{
  "filename": "my-video.mp4",
  "fileSizeByte": 524288000,
  "mimeType": "video/mp4",
  "title": "My First Video"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "videoId": "uuid",
    "uploadUrl": "https://s3.amazonaws.com/seamlis-media/videos/raw/uuid/original.mp4?X-Amz-Signature=...",
    "uploadMethod": "PUT",
    "expiresIn": 3600
  }
}
```

---

### 5.6 Comment Endpoints

```
GET    /api/v1/videos/:videoId/comments              Public    Comments (paginated, cursor)
POST   /api/v1/videos/:videoId/comments              Auth      Post comment
PUT    /api/v1/comments/:commentId                   Auth (owner) Edit comment
DELETE /api/v1/comments/:commentId                   Auth (owner/mod) Delete comment
POST   /api/v1/comments/:commentId/like              Auth      Like comment
DELETE /api/v1/comments/:commentId/like              Auth      Remove like
GET    /api/v1/comments/:commentId/replies           Public    Get replies (paginated)
POST   /api/v1/comments/:commentId/replies           Auth      Post reply
POST   /api/v1/comments/:commentId/pin               Auth (channel owner) Pin comment
```

---

### 5.7 Feed Endpoints

```
GET    /api/v1/feed/home          Auth/Anon    Personalized home feed (paginated)
GET    /api/v1/feed/trending      Public       Trending videos by region
GET    /api/v1/feed/subscriptions Auth         Subscription feed (paginated)
GET    /api/v1/feed/shorts        Auth/Anon    Shorts feed (cursor-based)
GET    /api/v1/feed/live          Public       Active livestreams
```

**GET /api/v1/feed/home**

Query params: `cursor`, `limit` (default 20, max 50)

---

### 5.8 Search Endpoints

```
GET    /api/v1/search?q=&type=&sort=&page=    Public    Search videos/channels/playlists
GET    /api/v1/search/suggestions?q=          Public    Search autocomplete suggestions
```

Query params:
- `q`: search query
- `type`: `VIDEO|CHANNEL|PLAYLIST|SHORT|LIVE` (default: all)
- `sort`: `RELEVANCE|DATE|VIEWS|RATING`
- `duration`: `SHORT|MEDIUM|LONG` (for videos)
- `upload_date`: `TODAY|WEEK|MONTH|YEAR`
- `cursor`: pagination cursor

---

### 5.9 Playlist Endpoints

```
GET    /api/v1/playlists/:playlistId            Public (if public)  Get playlist
POST   /api/v1/playlists                        Auth                Create playlist
PUT    /api/v1/playlists/:playlistId            Auth (owner)        Update playlist
DELETE /api/v1/playlists/:playlistId            Auth (owner)        Delete playlist
POST   /api/v1/playlists/:playlistId/videos     Auth (owner)        Add video
DELETE /api/v1/playlists/:playlistId/videos/:videoId Auth (owner)   Remove video
PUT    /api/v1/playlists/:playlistId/reorder    Auth (owner)        Reorder videos
GET    /api/v1/users/me/playlists               Auth                My playlists
```

---

### 5.10 Creator Studio Endpoints

```
GET    /api/v1/studio/overview                  Auth (creator)    Dashboard summary
GET    /api/v1/studio/videos                    Auth (creator)    Content list (paginated)
GET    /api/v1/studio/analytics/overview        Auth (creator)    Analytics summary
GET    /api/v1/studio/analytics/videos          Auth (creator)    Per-video analytics
GET    /api/v1/studio/analytics/audience        Auth (creator)    Audience data
GET    /api/v1/studio/comments                  Auth (creator)    Comment management
GET    /api/v1/studio/monetization              Auth (creator)    Revenue overview
GET    /api/v1/studio/live/settings             Auth (creator)    Live stream settings
POST   /api/v1/studio/live/keys/rotate          Auth (creator)    Rotate stream key
```

---

### 5.11 Livestream Endpoints

```
POST   /api/v1/live/streams                     Auth (creator)    Schedule/create stream
GET    /api/v1/live/streams/:streamId           Public            Get stream details + playback URL
PUT    /api/v1/live/streams/:streamId           Auth (creator)    Update stream metadata
POST   /api/v1/live/streams/:streamId/end       Auth (creator)    End livestream
GET    /api/v1/live/streams/:streamId/chat      WebSocket         Live chat (WS connection)
POST   /api/v1/live/streams/:streamId/chat      Auth              Send chat message
GET    /api/v1/live/active                      Public            List active streams
```

---

### 5.12 Notification Endpoints

```
GET    /api/v1/notifications                    Auth    List notifications
PUT    /api/v1/notifications/:id/read           Auth    Mark as read
PUT    /api/v1/notifications/read-all           Auth    Mark all read
DELETE /api/v1/notifications/:id                Auth    Delete notification
PUT    /api/v1/notifications/preferences        Auth    Update notification prefs
POST   /api/v1/notifications/push/register      Auth    Register push device token
DELETE /api/v1/notifications/push/deregister    Auth    Remove device token
```

---

### 5.13 Report Endpoints

```
POST   /api/v1/reports                 Auth    Submit report
GET    /api/v1/reports/my              Auth    View my submitted reports
```

---

### 5.14 Moderation Endpoints (Moderator/Admin Only)

```
GET    /api/v1/moderation/queue                 Mod/Admin    Review queue
GET    /api/v1/moderation/reports               Mod/Admin    All reports
PUT    /api/v1/moderation/reports/:id/resolve   Mod/Admin    Resolve report
POST   /api/v1/moderation/actions               Mod/Admin    Take action on content/user
GET    /api/v1/moderation/audit                 Admin        Audit log
```

---

### 5.15 Admin Endpoints

```
GET    /api/v1/admin/users              Admin    List users
GET    /api/v1/admin/users/:id          Admin    Get user details
PUT    /api/v1/admin/users/:id/role     Admin    Change user role
PUT    /api/v1/admin/users/:id/status   Admin    Suspend/ban/activate user
GET    /api/v1/admin/channels           Admin    List channels
GET    /api/v1/admin/videos             Admin    List all videos
GET    /api/v1/admin/payouts            Admin    View payout requests
PUT    /api/v1/admin/payouts/:id        Admin    Process payout
GET    /api/v1/admin/analytics          Admin    Platform analytics
GET    /api/v1/admin/health             Admin    System health
```

---

### 5.16 Community Post Endpoints

```
GET    /api/v1/channels/:channelId/community          Public          Posts (paginated)
POST   /api/v1/channels/:channelId/community          Auth (owner)    Create post
PUT    /api/v1/community/:postId                      Auth (owner)    Edit post
DELETE /api/v1/community/:postId                      Auth (owner)    Delete post
POST   /api/v1/community/:postId/like                 Auth            Like post
POST   /api/v1/community/:postId/vote                 Auth            Vote in poll
```

---

### 5.17 Analytics Event Ingestion

```
POST   /api/v1/events        Auth/Anon    Ingest client-side analytics events (batch)
```

Request:
```json
{
  "events": [
    {
      "name": "video_progress",
      "videoId": "uuid",
      "properties": { "percent": 25, "watchedSeconds": 45 },
      "sessionId": "sess_abc",
      "timestamp": "2026-08-18T09:00:00Z"
    }
  ]
}
```

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [Database Entity Model ←](./04-database-entity-model.md) | Next: [Video Processing Architecture →](./06-video-processing-architecture.md)*
