# Seamlis — Database Entity Model

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Design Principles

- All primary keys are **UUID v7** (time-ordered, index-friendly)
- All timestamps use **TIMESTAMPTZ** (UTC stored, timezone-aware)
- **Soft deletes** via `deleted_at` on entities that need audit trail
- **Indexes** defined on every foreign key and commonly queried column
- **No cross-module joins** in business logic — use the API layer for composition
- Analytics events stored in a **separate schema** designed for high-volume writes and future migration to ClickHouse

---

## 2. Entity Relationship Diagram (Simplified)

```
users ────────────────── profiles
  │                          │
  │    ┌────────────── channels
  │    │                    │
  │    │        ┌─── subscriptions ──┐
  │    │        │           │        │
  │    │        │         videos     │
  │    │        │           │        │
  │    │        │     ┌─────┼────┐   │
  │    │        │     │     │    │   │
  │    │   video_likes│  comments│   │
  │    │        │   video_assets  │   │
  │    │        │   video_variants │   │
  │    │        │   thumbnails    │   │
  │    │        │                │   │
  │    │    playlists ─── playlist_items
  │    │                         │
  │    └── watch_history          │
  │    └── watch_later            │
  │                               │
  └── notifications               │
  └── reports                     │
  └── community_posts ────────────┘
  └── memberships
  └── transactions
  └── payouts
  └── advertisements
  └── analytics_events (separate schema)
```

---

## 3. Core Tables

### 3.1 `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash   VARCHAR(255),                    -- NULL if social-only login
    role            VARCHAR(50) NOT NULL DEFAULT 'VIEWER',  -- VIEWER|CREATOR|MODERATOR|ADMIN
    status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|SUSPENDED|BANNED|DELETED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ                      -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### 3.2 `profiles`

```sql
CREATE TABLE profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name    VARCHAR(100) NOT NULL,
    avatar_url      VARCHAR(1000),
    bio             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

### 3.3 `channels`

```sql
CREATE TABLE channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    handle          VARCHAR(100) NOT NULL UNIQUE,     -- e.g. @seamliscreator
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    avatar_url      VARCHAR(1000),
    banner_url      VARCHAR(1000),
    subscriber_count BIGINT NOT NULL DEFAULT 0,
    video_count     INT NOT NULL DEFAULT 0,
    total_views     BIGINT NOT NULL DEFAULT 0,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    monetization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    country_code    CHAR(2),
    links           JSONB,                            -- [{title, url}]
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_channels_handle ON channels(LOWER(handle));
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_status ON channels(status);
```

### 3.4 `subscriptions`

```sql
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    notify_new_videos BOOLEAN NOT NULL DEFAULT TRUE,
    notify_live     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_subscription UNIQUE (subscriber_id, channel_id)
);

CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_channel ON subscriptions(channel_id);
```

### 3.5 `videos`

```sql
CREATE TABLE videos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL DEFAULT 'VIDEO',  -- VIDEO|SHORT
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'UPLOADING',
                    -- UPLOADING|PROCESSING|READY|FAILED|PRIVATE|UNLISTED|DELETED
    visibility      VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',  -- PUBLIC|UNLISTED|PRIVATE
    duration_seconds INT,
    file_size_bytes  BIGINT,
    original_filename VARCHAR(500),
    raw_storage_key VARCHAR(1000),                    -- S3 key for raw upload
    view_count      BIGINT NOT NULL DEFAULT 0,
    like_count      INT NOT NULL DEFAULT 0,
    dislike_count   INT NOT NULL DEFAULT 0,
    comment_count   INT NOT NULL DEFAULT 0,
    is_age_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    is_embeddable   BOOLEAN NOT NULL DEFAULT TRUE,
    language        CHAR(5),                          -- BCP-47 language tag
    tags            TEXT[],
    category        VARCHAR(100),
    location        VARCHAR(200),
    scheduled_at    TIMESTAMPTZ,                      -- For scheduled publishing
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_visibility ON videos(visibility);
CREATE INDEX idx_videos_type ON videos(type);
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_view_count ON videos(view_count DESC);
-- Full text search
CREATE INDEX idx_videos_fts ON videos USING GIN(
    to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(description,''))
);
```

### 3.6 `video_assets`

```sql
CREATE TABLE video_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    asset_type      VARCHAR(30) NOT NULL,  -- HLS_MASTER|HLS_VARIANT|THUMBNAIL|SUBTITLE
    storage_key     VARCHAR(1000) NOT NULL,
    cdn_url         VARCHAR(1000),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_assets_video_id ON video_assets(video_id);
CREATE INDEX idx_video_assets_type ON video_assets(video_id, asset_type);
```

### 3.7 `video_variants`

```sql
CREATE TABLE video_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    resolution      VARCHAR(10) NOT NULL,   -- 240p|360p|480p|720p|1080p|1440p|2160p
    width           INT NOT NULL,
    height          INT NOT NULL,
    bitrate_kbps    INT NOT NULL,
    codec           VARCHAR(20) NOT NULL,   -- h264|h265|vp9|av1
    storage_key     VARCHAR(1000) NOT NULL, -- HLS playlist for this variant
    file_size_bytes  BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_variants_video_id ON video_variants(video_id);
```

### 3.8 `thumbnails`

```sql
CREATE TABLE thumbnails (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    storage_key     VARCHAR(1000) NOT NULL,
    cdn_url         VARCHAR(1000),
    is_selected     BOOLEAN NOT NULL DEFAULT FALSE,
    is_auto         BOOLEAN NOT NULL DEFAULT TRUE,  -- Auto-generated vs creator-uploaded
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_thumbnails_video_id ON thumbnails(video_id);
```

### 3.9 `comments`

```sql
CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,  -- NULL = top-level
    content         TEXT NOT NULL,
    like_count      INT NOT NULL DEFAULT 0,
    reply_count     INT NOT NULL DEFAULT 0,
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    is_hearted      BOOLEAN NOT NULL DEFAULT FALSE,  -- Creator hearted
    status          VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',  -- VISIBLE|HIDDEN|REMOVED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_comments_video_id ON comments(video_id, created_at DESC);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
```

### 3.10 `video_likes`

```sql
CREATE TABLE video_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_like         BOOLEAN NOT NULL,  -- TRUE = like, FALSE = dislike
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_video_like UNIQUE (video_id, user_id)
);

CREATE INDEX idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON video_likes(user_id);
```

### 3.11 `comment_likes`

```sql
CREATE TABLE comment_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id      UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comment_like UNIQUE (comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
```

### 3.12 `playlists`

```sql
CREATE TABLE playlists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    visibility      VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    video_count     INT NOT NULL DEFAULT 0,
    thumbnail_url   VARCHAR(1000),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_playlists_user_id ON playlists(user_id);
```

### 3.13 `playlist_items`

```sql
CREATE TABLE playlist_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id     UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    position        INT NOT NULL,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_playlist_video UNIQUE (playlist_id, video_id)
);

CREATE INDEX idx_playlist_items_playlist ON playlist_items(playlist_id, position);
```

### 3.14 `watch_history`

```sql
CREATE TABLE watch_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_seconds INT NOT NULL DEFAULT 0,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_watch_history UNIQUE (user_id, video_id)
);

CREATE INDEX idx_watch_history_user ON watch_history(user_id, last_watched_at DESC);
```

### 3.15 `watch_later`

```sql
CREATE TABLE watch_later (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_watch_later UNIQUE (user_id, video_id)
);

CREATE INDEX idx_watch_later_user ON watch_later(user_id, added_at DESC);
```

### 3.16 `notifications`

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    -- NEW_VIDEO|LIVE_START|COMMENT_REPLY|LIKE|SUBSCRIPTION|MENTION|MEMBERSHIP|MILESTONE
    title           VARCHAR(500) NOT NULL,
    body            TEXT,
    image_url       VARCHAR(1000),
    action_url      VARCHAR(1000),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

### 3.17 `reports`

```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type     VARCHAR(30) NOT NULL,  -- VIDEO|COMMENT|CHANNEL|USER
    target_id       UUID NOT NULL,
    reason          VARCHAR(100) NOT NULL,
    description     TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING|UNDER_REVIEW|RESOLVED|DISMISSED
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status, created_at);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
```

### 3.18 `moderation_cases`

```sql
CREATE TABLE moderation_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES reports(id),
    moderator_id    UUID REFERENCES users(id),
    target_type     VARCHAR(30) NOT NULL,
    target_id       UUID NOT NULL,
    action          VARCHAR(50) NOT NULL,
    -- WARN|REMOVE_CONTENT|SUSPEND|BAN|DISMISS|ESCALATE
    reason          TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_cases_target ON moderation_cases(target_type, target_id);
CREATE INDEX idx_moderation_cases_moderator ON moderation_cases(moderator_id);
```

### 3.19 `livestreams`

```sql
CREATE TABLE livestreams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    stream_key      VARCHAR(200) NOT NULL UNIQUE,    -- RTMP stream key (hashed for display)
    ingest_url      VARCHAR(1000),
    status          VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    -- SCHEDULED|LIVE|ENDED|CANCELLED
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    peak_viewers    INT NOT NULL DEFAULT 0,
    replay_video_id UUID REFERENCES videos(id),     -- Auto-created replay
    thumbnail_url   VARCHAR(1000),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_livestreams_channel ON livestreams(channel_id);
CREATE INDEX idx_livestreams_status ON livestreams(status);
```

### 3.20 `community_posts`

```sql
CREATE TABLE community_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL DEFAULT 'TEXT',  -- TEXT|IMAGE|POLL|QUESTION
    content         TEXT,
    images          JSONB,                          -- [{url, alt}]
    poll_options    JSONB,                          -- [{id, text, vote_count}]
    like_count      INT NOT NULL DEFAULT 0,
    comment_count   INT NOT NULL DEFAULT 0,
    visibility      VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_community_posts_channel ON community_posts(channel_id, created_at DESC);
```

### 3.21 `memberships`

```sql
CREATE TABLE memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    tier_name       VARCHAR(100) NOT NULL,
    price_cents     INT NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|CANCELLED|EXPIRED
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    CONSTRAINT uq_membership UNIQUE (user_id, channel_id)
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_channel ON memberships(channel_id);
```

### 3.22 `transactions`

```sql
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(30) NOT NULL,
    -- AD_REVENUE|TIP|MEMBERSHIP|PAID_CONTENT|REFUND|PAYOUT|PLATFORM_FEE|TAX
    channel_id      UUID REFERENCES channels(id),
    user_id         UUID REFERENCES users(id),
    gross_amount_cents  BIGINT NOT NULL,
    platform_fee_cents  BIGINT NOT NULL DEFAULT 0,
    tax_cents           BIGINT NOT NULL DEFAULT 0,
    adjustment_cents    BIGINT NOT NULL DEFAULT 0,
    net_amount_cents    BIGINT NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    external_ref    VARCHAR(200),                   -- Stripe charge ID, etc.
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_channel ON transactions(channel_id, created_at DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### 3.23 `payouts`

```sql
CREATE TABLE payouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
    amount_cents    BIGINT NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING|PROCESSING|COMPLETED|FAILED
    payment_method  VARCHAR(50),
    external_ref    VARCHAR(200),
    notes           TEXT,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_channel ON payouts(channel_id, created_at DESC);
CREATE INDEX idx_payouts_status ON payouts(status);
```

### 3.24 `advertisements`

```sql
CREATE TABLE advertisements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id   UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(300) NOT NULL,
    type            VARCHAR(30) NOT NULL,           -- PRE_ROLL|MID_ROLL|DISPLAY
    video_url       VARCHAR(1000),
    landing_url     VARCHAR(1000) NOT NULL,
    budget_cents    BIGINT NOT NULL,
    spent_cents     BIGINT NOT NULL DEFAULT 0,
    cpm_cents       INT NOT NULL,                   -- Cost per 1000 impressions
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    targeting       JSONB,                          -- {countries, categories, keywords}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advertisements_status ON advertisements(status);
```

---

## 4. Analytics Schema (High-Volume, Separate)

```sql
-- Separate schema for analytics (future ClickHouse migration candidate)
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE analytics.events (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    event_name      VARCHAR(100) NOT NULL,
    user_id         UUID,
    session_id      VARCHAR(100),
    video_id        UUID,
    channel_id      UUID,
    properties      JSONB,
    platform        VARCHAR(20),                    -- WEB|ANDROID|IOS
    ip_hash         VARCHAR(64),                    -- Hashed for privacy
    country_code    CHAR(2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE analytics.events_2026_08 PARTITION OF analytics.events
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
```

**Standard Event Names:**
```
video_impression, video_started, video_progress, video_completed, video_skipped,
video_liked, video_shared, video_commented, channel_subscribed, channel_unsubscribed,
search_performed, short_viewed, short_swiped, live_joined, live_left,
notification_received, notification_opened, ad_impression, ad_clicked
```

---

## 5. Database Migration Strategy

- **Tool:** Flyway (versioned migrations)
- **Location:** `backend/api/src/main/resources/db/migration/`
- **Naming:** `V001__create_users.sql`, `V002__create_channels.sql`, etc.
- **Rules:**
  - Never modify existing migrations
  - All schema changes via new migration files
  - Migrations run automatically on deployment (CI/CD step)
  - Rollback via explicit `U__` undo migrations for critical changes

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [Component Architecture ←](./03-component-architecture.md) | Next: [API Architecture →](./05-api-architecture.md)*
