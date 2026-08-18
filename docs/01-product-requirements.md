# Seamlis — Product Requirements Document

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Executive Summary

Seamlis is a creator-first, green-branded video-sharing platform designed to compete with YouTube at scale. It combines long-form video hosting, TikTok-style short-form discovery, Twitch-style livestreaming, Patreon-style memberships, and social community features. The platform targets independent creators and emerging markets, while the architecture is designed to scale globally.

**Mission:** Empower every creator to build an audience, earn income, and connect with their community — on a platform that feels fast, modern, and built for them.

---

## 2. User Personas

### 2.1 The Viewer

| Attribute | Description |
|-----------|-------------|
| **Goal** | Discover interesting content, be entertained, learn |
| **Behaviors** | Browses home feed, searches, watches recommended videos, subscribes to creators |
| **Pain Points** | Irrelevant recommendations, slow loading, autoplay fatigue |
| **Devices** | Mobile-first (60%), desktop (30%), tablet (10%) |

**Key journeys:**
- Open app → see personalized feed → watch video → subscribe
- Search for topic → find channel → binge playlist
- Discover Short → watch full video → subscribe to creator

### 2.2 The Aspiring Creator

| Attribute | Description |
|-----------|-------------|
| **Goal** | Build an audience, grow channel, eventually earn income |
| **Behaviors** | Uploads videos, engages with comments, monitors analytics |
| **Pain Points** | Not understanding why videos underperform, low discoverability |
| **Devices** | Desktop for editing/uploading, mobile for monitoring |

**Key journeys:**
- Create account → set up channel → upload first video → share link
- Check Creator Studio → review analytics → optimize next upload
- Enable monetization → track earnings → receive payout

### 2.3 The Professional Creator

| Attribute | Description |
|-----------|-------------|
| **Goal** | Maximize revenue, manage community, grow membership |
- **Behaviors:** Multi-format content (long-form, Shorts, Live), manages team, uses advanced analytics |
| **Pain Points** | Revenue unpredictability, copyright issues, moderation burden |
| **Devices** | Desktop-primary, streaming hardware |

**Key journeys:**
- Launch livestream → engage live chat → save replay
- Create membership tier → offer exclusive content → track members
- Receive copyright claim → dispute → resolve

### 2.4 The Moderator

| Attribute | Description |
|-----------|-------------|
| **Goal** | Keep the platform safe, review reported content |
| **Behaviors** | Works moderation queue, reviews reports, makes decisions |
| **Tools Needed** | Moderation dashboard, video playback, user history, action logs |

### 2.5 The Administrator

| Attribute | Description |
|-----------|-------------|
| **Goal** | Manage the platform, users, payments, system health |
| **Behaviors** | Manages users, channels, payouts, advertising, system config |
| **Access Level** | Full platform access with audit logging |

---

## 3. User Roles & Permissions

```
VIEWER       → Watch, like, comment, subscribe, create playlists, watch history
CREATOR      → All viewer permissions + upload videos, manage channel, creator studio, live stream, monetization
MODERATOR    → All viewer permissions + content review, moderation queue, report resolution
ADMIN        → All permissions + user management, payouts, advertising, system config, audit logs
```

### 3.1 Permission Matrix

| Feature | Viewer | Creator | Moderator | Admin |
|---------|--------|---------|-----------|-------|
| Watch videos | ✅ | ✅ | ✅ | ✅ |
| Like/comment | ✅ | ✅ | ✅ | ✅ |
| Subscribe | ✅ | ✅ | ✅ | ✅ |
| Upload video | ❌ | ✅ | ❌ | ✅ |
| Creator Studio | ❌ | ✅ | ❌ | ✅ |
| Livestream | ❌ | ✅ | ❌ | ✅ |
| Moderation queue | ❌ | ❌ | ✅ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ |
| Payout management | ❌ | ❌ | ❌ | ✅ |
| System config | ❌ | ❌ | ❌ | ✅ |

---

## 4. Core Feature Requirements

### 4.1 Content Types

| Type | Description | Format |
|------|-------------|--------|
| **Long-form Video** | Standard videos >60s | Horizontal 16:9 |
| **Shorts** | Short vertical videos ≤60s | Vertical 9:16 |
| **Livestream** | Real-time broadcast | Horizontal, RTMP ingestion |
| **Community Post** | Text, images, polls | Social card format |

### 4.2 Discovery Features

- **Home Feed** — Personalized recommendations based on watch history, subscriptions, trending
- **Trending** — Platform-wide trending content by region
- **Subscriptions Feed** — Chronological content from subscribed channels
- **Search** — Full-text search across videos, channels, playlists, Shorts
- **Shorts Feed** — Full-screen vertical swipe feed
- **Live Feed** — Active livestreams, sorted by viewers

### 4.3 Creator Features

| Feature | Description |
|---------|-------------|
| **Channel** | Custom URL, banner, avatar, bio, social links |
| **Upload** | Drag-and-drop, progress tracking, resumable |
| **Creator Studio** | Dashboard with analytics, content manager, comment moderation |
| **Analytics** | Views, watch time, CTR, RPM, audience retention, geography |
| **Community** | Posts, polls, announcements to subscribers |
| **Monetization** | Ad revenue, tips, memberships, paid content |
| **Livestreaming** | RTMP ingestion, live chat, clips, replay |

### 4.4 Engagement Features

- Likes/dislikes on videos and comments
- Comments with nested replies (up to 2 levels)
- Shares (internal + external link)
- Playlists (public/private)
- Watch History
- Watch Later
- Subscriptions with notification preferences

### 4.5 Monetization

| Stream | Mechanism |
|--------|-----------|
| **Advertising** | Pre-roll, mid-roll, display ads; CPM-based revenue share |
| **Creator Tips** | One-time payments during live or on video |
| **Memberships** | Monthly recurring; tiers with exclusive content |
| **Paid Content** | PPV videos or content libraries |
| **Platform Subscription** | Seamlis Premium — ad-free viewing |

### 4.6 Moderation & Safety

- User reporting (video, comment, channel, user)
- Automated spam detection
- Content review queue
- Creator appeals process
- Copyright claim system
- Admin audit logs for all moderation actions

---

## 5. Core User Journeys

### 5.1 New User Registration to First Watch

```
1. Land on home page (anonymous feed visible)
2. Click "Sign Up"
3. Enter email + password (or social login)
4. Verify email
5. Complete profile (display name, avatar)
6. Home feed shows recommended content
7. Click video → Watch page
8. Like video → Subscribe to channel
9. Next session: subscriptions feed populated
```

### 5.2 Creator Channel Launch

```
1. Log in as verified user
2. Navigate to "Create Channel"
3. Enter channel name, handle, description
4. Upload avatar and banner
5. Navigate to Creator Studio
6. Click "Upload Video"
7. Drag file → Progress bar → Processing
8. Add title, description, thumbnail, tags
9. Set visibility (public/unlisted/private)
10. Publish → Video appears in channel
```

### 5.3 Viewer to Subscriber to Member

```
1. Discover creator via recommendation
2. Watch multiple videos (organic)
3. Subscribe (free)
4. Enable notifications (bell)
5. Receive push notification for new video
6. Join membership tier
7. Access exclusive content
```

### 5.4 Livestream Session

```
1. Creator sets up streaming software (OBS)
2. Copies RTMP URL + stream key from Creator Studio
3. Starts stream → platform ingests RTMP
4. Viewers see live badge on channel
5. Join live → chat, react, tip
6. Stream ends → replay auto-saved
7. Creator can clip segments
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target |
|--------|--------|
| Home feed load | < 1.5s LCP |
| Video start time | < 2s (cold start) |
| API response (p99) | < 200ms |
| Search results | < 500ms |
| Video upload throughput | ≥ 100 Mbps per user session |

### 6.2 Scalability

| Stage | Target |
|-------|--------|
| Launch | 100 concurrent users |
| Growth | 10,000 concurrent users |
| Scale | 1,000,000+ concurrent users |

Architecture must not require full rewrite between stages.

### 6.3 Availability

- Target SLA: **99.9%** uptime (≤8.7h downtime/year)
- Video delivery via CDN — independent of API availability
- Database: automated backups every 6 hours, PITR enabled

### 6.4 Security

- GDPR and privacy-by-design
- Password hashing with Argon2id
- JWT-based authentication with short-lived access tokens
- Rate limiting on all public endpoints
- Zero secrets in source control

### 6.5 Accessibility

- WCAG 2.1 AA compliance target
- Keyboard navigation throughout
- Screen reader support
- Captions on all videos (user-uploaded or auto-generated)
- Minimum 4.5:1 color contrast ratio

---

## 7. Success Metrics & KPIs

### 7.1 Growth Metrics

| Metric | Definition |
|--------|------------|
| MAU | Monthly Active Users |
| DAU/MAU | Daily engagement rate (target >40%) |
| Subscriber Growth Rate | New channel subscriptions per week |
| Creator Retention | % creators with 2nd upload within 30 days |

### 7.2 Engagement Metrics

| Metric | Target |
|--------|--------|
| Average Watch Duration | >50% of video length |
| Comments per Video | >0.5% of views |
| Like Rate | >3% of views |
| Shorts Completion Rate | >60% |

### 7.3 Creator Metrics

| Metric | Target |
|--------|--------|
| Videos Uploaded / Creator / Month | >2 |
| Creator Studio Weekly Active | >60% of uploading creators |
| Monetization Enrollment | >30% of eligible creators |

### 7.4 Platform Health

| Metric | Target |
|--------|--------|
| Content Moderation Response Time | <24h for reported content |
| Copyright Dispute Resolution | <7 days |
| Video Processing P99 | <10min for 1080p |

---

## 8. Constraints & Risks

| Risk | Mitigation |
|------|------------|
| Video storage costs at scale | CDN + tiered storage (hot/warm/cold) |
| FFmpeg processing bottleneck | Horizontal scaling of processing workers |
| Recommendation cold start | Trending fallback for new users |
| Creator churn | Rich analytics, monetization tools, community features |
| Legal (copyright, CSAM) | Copyright system, CSAM detection workflow, audit logs |
| Mobile app store policies | Separate web-based payment flows from in-app purchases |

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Next: [System Architecture →](./02-system-architecture.md)*
