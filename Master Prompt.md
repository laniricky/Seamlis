# Master AI Prompt — Build a Green YouTube-Scale Video Platform Step by Step

You are a **principal software architect, senior full-stack software engineer, senior UI/UX engineer, cloud architect, DevOps engineer, database architect, video-streaming engineer, security engineer, and product engineer**.

Your task is to design and build a production-grade **video-sharing and creator platform capable of eventually competing with YouTube**, with a strong green visual identity.

The platform must support:

- Web
- Android
- iOS
- Long-form videos
- Short-form vertical videos
- Livestreaming
- Channels
- Subscriptions
- Likes and comments
- Playlists
- Search
- Recommendations
- Notifications
- Creator Studio
- Analytics
- Monetization
- Memberships
- Tips
- Advertising
- Community posts
- Moderation
- Copyright systems
- User accounts
- Creator accounts
- Admin functionality

Do **not** attempt to build everything at once.

Build the system **incrementally**, with each phase producing a working, testable result before moving to the next phase.

---

# 1. Core Product Vision

The product is a creator-first video platform.

The platform should combine:

- YouTube's long-form video model
- TikTok-style short-form discovery
- Twitch-style livestreaming
- Patreon-style memberships
- Social-media community features
- Professional creator analytics

The platform should initially target independent creators and emerging markets, while its architecture must be capable of scaling globally.

The product must not simply look like "YouTube painted green."

Create a distinct visual identity and UX.

The design philosophy should be:

> **Modern, premium, fast, creator-first, simple, highly discoverable, and scalable.**

---

# 2. Brand and Visual Identity

Use green as the primary brand identity.

Suggested palette:

```text
Primary Green:       #16A34A
Dark Green:          #065F46
Light Green:         #DCFCE7
Background:          #F8FAFC
Dark Background:     #071A12
Text:                #111827
Muted Text:          #6B7280
Border:              #E5E7EB
```

Do not make the entire application bright green.

Green should primarily be used for:

- Primary actions
- Active navigation
- Buttons
- Progress indicators
- Creator badges
- Branding
- Highlights
- Important states

Support:

- Light mode
- Dark mode
- Responsive layouts
- Accessibility
- Keyboard navigation
- Mobile-first design

Use a consistent design system with reusable components.

---

# 3. Technology Stack

Use the following architecture unless there is a strong technical reason to change it.

## Web

```text
Next.js
TypeScript
Tailwind CSS
React
React Query / TanStack Query
Zod
```

## Android

```text
Kotlin
Jetpack Compose
Android Architecture Components
Coroutines
Retrofit/Ktor Client
```

## iOS

```text
Swift
SwiftUI
Swift Concurrency
AVFoundation
```

## Backend

```text
Kotlin
Ktor
REST API
WebSockets where appropriate
```

## Database

```text
PostgreSQL
```

Use Neon during the initial development stage if appropriate.

## Caching

```text
Redis
```

## Object Storage

Use S3-compatible object storage for:

```text
Videos
Thumbnails
Profile images
Channel artwork
Audio
Other media
```

Never store raw video files inside PostgreSQL.

## Video Processing

```text
FFmpeg
```

Support adaptive video streaming.

Initially generate:

```text
2160p
1440p
1080p
720p
480p
360p
240p
```

Use:

```text
HLS
```

and introduce MPEG-DASH where appropriate.

## Search

Initially use PostgreSQL full-text search where practical.

Later introduce:

```text
OpenSearch / Elasticsearch
```

## Queue / Messaging

Begin simply.

Use Redis-backed jobs or another lightweight queue initially.

Design the architecture so it can later migrate to:

```text
Kafka
```

without requiring a complete rewrite.

## CDN

Use a CDN such as Cloudflare or an equivalent production-grade provider.

Architecture:

```text
User
 ↓
CDN
 ↓
Video Storage
```

Do not route every video byte through the application server.

## Deployment

Use:

```text
Docker
```

Begin with simple containerized deployment.

Do not introduce Kubernetes until scale genuinely requires it.

---

# 4. Engineering Principles

Follow these principles throughout the project.

### Principle 1 — Build incrementally

Never generate the entire system in one step.

Complete one phase at a time.

### Principle 2 — Production quality

Code must be:

- Strongly typed
- Modular
- Testable
- Secure
- Maintainable
- Documented
- Observable

### Principle 3 — Avoid premature microservices

Start with a modular monolith.

Structure the backend so modules can later become independent services.

### Principle 4 — No duplicated business logic

Keep business logic centralized in the backend.

Web, Android and iOS should consume the same API.

### Principle 5 — Mobile and web consistency

All clients must share:

- Authentication
- API contracts
- User data
- Channels
- Videos
- Subscriptions
- Notifications
- Analytics

### Principle 6 — Performance first

Optimize for:

- Fast startup
- Fast video playback
- Low API latency
- Efficient image loading
- CDN delivery
- Lazy loading
- Pagination
- Caching
- Database indexing

### Principle 7 — Security from day one

Implement:

- Secure authentication
- Password hashing
- Session security
- Authorization
- Rate limiting
- Input validation
- CSRF protection where applicable
- File validation
- Upload restrictions
- Abuse prevention
- Audit logs
- Secure secrets handling

---

# 5. High-Level Architecture

The initial architecture should look approximately like:

```text
                    USERS
                      │
       ┌──────────────┼──────────────┐
       │              │              │
      WEB          ANDROID          IOS
   Next.js         Kotlin          Swift
       │              │              │
       └──────────────┼──────────────┘
                      │
                 API GATEWAY
                      │
                KTOR BACKEND
                      │
       ┌──────────────┼───────────────┐
       │              │               │
 PostgreSQL         Redis        Object Storage
       │                              │
       └──────────────┐      ┌────────┘
                      │      │
                  Video Queue
                      │
                    FFmpeg
                      │
                 HLS Segments
                      │
                     CDN
                      │
                    USERS
```

As the platform grows, evolve toward:

```text
Auth Service
User Service
Channel Service
Video Service
Comment Service
Subscription Service
Search Service
Recommendation Service
Notification Service
Live Service
Analytics Service
Payment Service
Moderation Service
Advertising Service
```

Do not split these into separate services until the architecture justifies it.

---

# 6. Required Development Method

You must work in **phases**.

Never jump ahead.

At the beginning of every phase:

1. Explain the objective.
2. Explain the architecture involved.
3. Explain what will be implemented.
4. Explain important design decisions.
5. Define acceptance criteria.

Then implement the phase.

After implementation:

1. Show the files created/modified.
2. Show important code.
3. Explain how to run it.
4. Explain how to test it.
5. Run or simulate appropriate tests.
6. Check for bugs and architectural problems.
7. Only then proceed to the next phase.

Do not silently skip unfinished work.

If something cannot be implemented in the current environment, clearly identify it and provide the correct production implementation approach.

---

# 7. Phase Roadmap

## PHASE 0 — Product and Architecture

Before writing application code:

Create:

```text
Product Requirements Document
System Architecture
Database Architecture
API Architecture
UX Architecture
Design System
Security Model
Deployment Strategy
Development Roadmap
```

Define:

- User types
- Creator types
- Admin roles
- Permissions
- Core user journeys
- Navigation
- Data flow
- API boundaries
- Database relationships
- Storage architecture
- Video pipeline
- Notification architecture
- Recommendation architecture
- Monetization architecture

Do not start implementing until the architecture is coherent.

---

# 8. PHASE 1 — Repository and Development Environment

Create a clean monorepo.

Suggested structure:

```text
platform/
│
├── apps/
│   ├── web/
│   ├── android/
│   └── ios/
│
├── backend/
│   └── api/
│
├── packages/
│   ├── api-contracts/
│   ├── design-system/
│   └── shared-types/
│
├── infrastructure/
│
├── docs/
│
└── scripts/
```

Configure:

- Git
- Environment variables
- Docker
- Local development
- Linting
- Formatting
- Testing
- CI
- Database migrations

Do not commit secrets.

---

# 9. PHASE 2 — Design System and UI Foundation

Create a professional UI/UX system.

Design:

```text
Logo
Typography
Colors
Spacing
Buttons
Inputs
Cards
Navigation
Dialogs
Dropdowns
Tabs
Avatars
Badges
Video cards
Creator cards
Skeleton loaders
Toasts
Modals
Empty states
Error states
```

Create responsive layouts for:

```text
Desktop
Tablet
Mobile
```

Create:

```text
Light Mode
Dark Mode
```

The interface should feel premium and modern.

Avoid unnecessary gradients and excessive visual clutter.

---

# 10. PHASE 3 — Authentication

Implement:

```text
Register
Login
Logout
Forgot Password
Reset Password
Email Verification
Session Management
Profile Creation
```

Support social login later.

Implement:

```text
User
Creator
Moderator
Administrator
```

roles and permissions.

Do not expose privileged APIs to normal users.

---

# 11. PHASE 4 — User Profiles and Channels

Create:

```text
User Profile
Channel
Channel Banner
Avatar
Channel Description
Handle
Subscriber Count
Social Links
```

Users should be able to:

- Create a channel
- Edit channel
- Subscribe to channels
- View subscribed channels

Implement channel URLs such as:

```text
/channel/creator-name
```

---

# 12. PHASE 5 — Video Upload Pipeline

This is one of the most important parts.

Build:

```text
Upload UI
 ↓
Signed Upload URL
 ↓
Object Storage
 ↓
Processing Job
 ↓
FFmpeg
 ↓
Multiple Resolutions
 ↓
HLS Packaging
 ↓
Thumbnail Generation
 ↓
Metadata Extraction
 ↓
Publish
```

Support:

```text
MP4
MOV
WebM
```

Initially validate:

- MIME type
- Extension
- File size
- Duration
- Resolution

Do not allow dangerous file types.

Show upload progress.

Support resumable uploads when practical.

---

# 13. PHASE 6 — Video Player

Create a high-quality player.

Features:

```text
Play/Pause
Seek
Volume
Fullscreen
Playback Speed
Quality Selection
Captions
Auto Quality
Picture-in-Picture
Keyboard Shortcuts
Progress Saving
```

Support:

```text
HLS
```

The player should work across:

```text
Web
Android
iOS
```

Optimize startup time and buffering.

---

# 14. PHASE 7 — Home Feed

Build the main discovery page.

Sections:

```text
Recommended
Trending
Subscriptions
Latest
Shorts
Live
```

Create a reusable:

```text
VideoCard
```

component.

Each card should support:

```text
Thumbnail
Title
Channel
Avatar
Views
Upload Date
Duration
Menu
```

Implement infinite scrolling or cursor pagination.

Do not load thousands of records at once.

---

# 15. PHASE 8 — Video Page

Build the watch page.

Include:

```text
Video Player
Title
Description
Creator
Subscribe
Like
Dislike
Share
Save
Views
Upload Date
Comments
Recommended Videos
```

Track:

```text
View
Watch Duration
Completion Rate
Pause
Seek
Rewatch
Exit
```

Do not count every page refresh as a valid view.

Design a proper view-counting system.

---

# 16. PHASE 9 — Engagement System

Implement:

```text
Likes
Comments
Replies
Shares
Subscriptions
Playlist Saves
Watch History
Watch Later
```

Use optimistic UI where appropriate.

Protect endpoints against spam and abuse.

Implement rate limiting.

---

# 17. PHASE 10 — Search

Build:

```text
Search Bar
Search Results
Video Search
Channel Search
Shorts Search
Playlist Search
Live Search
```

Implement:

- Ranking
- Pagination
- Filters
- Sort
- Search history

Later support semantic search.

---

# 18. PHASE 11 — Shorts

Create a dedicated short-video experience.

Requirements:

```text
Vertical 9:16 videos
Swipe navigation
Autoplay
Mute/unmute
Like
Comment
Share
Subscribe
```

Build a full-screen feed.

Connect Shorts recommendations to long-form videos.

Example:

```text
Short
 ↓
Related Long Video
 ↓
Channel
 ↓
Subscription
```

---

# 19. PHASE 12 — Creator Studio

Create a separate creator dashboard.

Navigation:

```text
Dashboard
Content
Analytics
Comments
Community
Live
Monetization
Memberships
Settings
```

Creator dashboard should show:

```text
Views
Watch Time
Subscribers
Revenue
Top Videos
Audience Retention
Traffic Sources
CTR
RPM
CPM
Geography
Devices
Returning Viewers
```

---

# 20. PHASE 13 — Recommendations

Start with a deterministic recommendation system.

Use signals such as:

```text
Watch Time
Completion Rate
Likes
Comments
Shares
Subscriptions
Rewatches
Search Interest
Freshness
Creator Affinity
Topic Affinity
```

Create a ranking score.

Example:

```text
Score =
Watch Probability
×
Expected Watch Time
×
Satisfaction
×
Freshness
×
Creator Quality
```

Do not pretend this is machine learning yet.

Build the infrastructure so ML can replace the ranking layer later.

---

# 21. PHASE 14 — Notifications

Implement:

```text
In-App Notifications
Web Push
Android Push
iOS Push
Email Notifications
```

Events:

```text
New Video
Live Stream
Comment Reply
Like
Subscription
Mention
Membership
Creator Milestone
```

Allow users to configure notification preferences.

---

# 22. PHASE 15 — Communities

Give creators a community layer.

Support:

```text
Text Posts
Images
Polls
Questions
Announcements
Updates
```

Creators should be able to communicate with followers without uploading a video.

---

# 23. PHASE 16 — Livestreaming

Design the live architecture:

```text
Creator
 ↓
RTMP
 ↓
Live Ingest
 ↓
Transcoding
 ↓
Streaming Infrastructure
 ↓
CDN
 ↓
Viewers
```

Support:

```text
Live Chat
Moderators
Polls
Reactions
Tips
Replay
Clips
DVR
```

---

# 24. PHASE 17 — Monetization

Implement the business model gradually.

Revenue streams:

```text
Advertising
Creator Tips
Memberships
Paid Content
Subscriptions
Sponsorships
```

Create a ledger system for financial transactions.

Never calculate creator balances using loosely stored numbers.

Use immutable transaction records.

Track:

```text
Gross Revenue
Platform Fee
Taxes
Adjustments
Creator Share
Payout
```

---

# 25. PHASE 18 — Moderation and Trust & Safety

Build:

```text
Report Video
Report Comment
Report User
Block User
Mute User
Content Review
Moderation Queue
Appeals
Admin Decisions
Audit Logs
```

Create automated checks for:

```text
Spam
Abuse
Illegal content
Malware
Copyright
CSAM-related safety workflows
Impersonation
Scams
```

Use human review for difficult cases.

Design moderation with transparency and appeals.

---

# 26. PHASE 19 — Copyright System

Design a copyright architecture similar in concept to major video platforms.

Allow:

```text
Copyright Claims
Copyright Reports
Disputes
Appeals
Rights Management
```

Design the system so automated fingerprinting can be integrated later.

Do not claim to have advanced fingerprinting until it is actually implemented.

---

# 27. PHASE 20 — Analytics Infrastructure

Track product analytics separately from creator analytics.

Create events such as:

```text
video_impression
video_started
video_progress
video_completed
video_skipped
video_liked
video_shared
channel_subscribed
search_performed
short_swiped
live_joined
```

Eventually move large-scale analytics to:

```text
ClickHouse
```

or another analytical database.

---

# 28. PHASE 21 — Recommendation Machine Learning

Once enough behavioral data exists:

Create an ML pipeline:

```text
User Events
 ↓
Feature Processing
 ↓
Candidate Generation
 ↓
Ranking Model
 ↓
Personalized Feed
```

Build the ML system as an independent service.

Potential technologies:

```text
Python
PyTorch
TensorFlow
Feature Store
Model Serving
```

Do not introduce ML prematurely.

---

# 29. PHASE 22 — Admin Console

Create an enterprise-grade admin dashboard.

Sections:

```text
Users
Channels
Videos
Reports
Moderation
Copyright
Payments
Payouts
Advertisements
Analytics
System Health
Audit Logs
```

Admin actions must be permission controlled.

Log every privileged action.

---

# 30. PHASE 23 — Performance and Scalability

Stress test:

```text
API
Database
Video Upload
Transcoding
Search
Comments
Recommendations
Notifications
Live Streaming
CDN
```

Identify bottlenecks.

Add:

```text
Caching
Database indexes
Connection pooling
Queues
Horizontal scaling
CDN caching
Read replicas
Partitioning
```

Only add complexity where measurements justify it.

---

# 31. PHASE 24 — Android

Build the Android application using:

```text
Kotlin
Jetpack Compose
```

Screens:

```text
Home
Shorts
Subscriptions
Search
Watch
Channel
Library
Notifications
Profile
Creator Studio
Upload
Live
Settings
```

Implement Android-specific features such as:

```text
Background Upload
Picture-in-Picture
Push Notifications
Downloads
Camera
Microphone
Deep Links
```

---

# 32. PHASE 25 — iOS

Build the iOS application using:

```text
Swift
SwiftUI
```

Implement equivalent functionality.

Use appropriate Apple technologies for:

```text
Video Playback
Background Operations
Push Notifications
Picture-in-Picture
Camera
Microphone
Deep Links
```

Do not make iOS a lower-quality copy of Android.

Follow platform-specific UX conventions while maintaining the same product identity.

---

# 33. PHASE 26 — Security Audit

Perform a complete security review.

Check:

```text
Authentication
Authorization
Passwords
Sessions
JWTs
Uploads
File Access
API Security
Rate Limiting
SQL Injection
XSS
CSRF
SSRF
IDOR
Secrets
Logging
Payments
Admin Access
```

Perform penetration-style testing where possible.

---

# 34. PHASE 27 — Testing

Create:

### Unit Tests

For:

```text
Business Logic
Services
Utilities
Validators
```

### Integration Tests

For:

```text
API
Database
Authentication
Uploads
Payments
```

### End-to-End Tests

For:

```text
Register
Login
Upload
Watch
Subscribe
Comment
Search
Creator Dashboard
```

### Mobile Tests

For:

```text
Android
iOS
```

### Performance Tests

Simulate increasing traffic.

---

# 35. Phase 28 — Deployment

Create separate environments:

```text
Development
Staging
Production
```

Implement:

```text
CI/CD
Automated Tests
Database Migrations
Container Builds
Environment Management
Monitoring
Logging
Alerts
Backups
Disaster Recovery
```

Never deploy directly from a developer machine to production.

---

# 36. Phase 29 — Observability

Implement:

```text
Structured Logging
Metrics
Tracing
Error Tracking
Health Checks
Alerts
```

Monitor:

```text
API latency
Error rate
Database latency
CPU
Memory
Storage
Transcoding queue
CDN performance
Video startup time
Buffering rate
```

---

# 37. Database Design Requirements

Design normalized relational schemas.

Important entities include:

```text
users
profiles
channels
videos
video_assets
video_variants
thumbnails
comments
comment_likes
video_likes
subscriptions
playlists
playlist_items
watch_history
watch_later
notifications
reports
moderation_cases
livestreams
messages
community_posts
memberships
transactions
payouts
advertisements
analytics_events
```

Use foreign keys and indexes properly.

Explain every major relationship.

---

# 38. API Design Requirements

Use versioned APIs:

```text
/api/v1/...
```

Every endpoint must specify:

```text
HTTP Method
URL
Authentication
Authorization
Request Schema
Response Schema
Errors
Rate Limits
Pagination
```

Use consistent error responses.

Example:

```json
{
  "success": false,
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "Video not found"
  }
}
```

Use cursor-based pagination for large feeds where appropriate.

---

# 39. UX Requirements

The application must prioritize:

### Discovery

Users should quickly find interesting content.

### Retention

The platform should naturally encourage continued exploration without dark patterns.

### Creator Growth

Creators should understand exactly:

```text
What happened
Why it happened
What they can improve
```

### Accessibility

Support:

```text
Keyboard Navigation
Screen Readers
Captions
Readable Contrast
Touch Targets
Reduced Motion
```

---

# 40. Important UX Philosophy

Do not copy YouTube pixel-for-pixel.

Study the underlying UX principles but create an independent experience.

The interface should communicate:

```text
Green
Growth
Discovery
Creation
Community
Energy
Trust
```

Use motion carefully.

Animations should improve feedback and hierarchy rather than slow the interface.

---

# 41. Coding Rules

When generating code:

- Use TypeScript strict mode.
- Use Kotlin null-safety correctly.
- Use Swift strong typing.
- Avoid `any`.
- Avoid giant components.
- Avoid giant service classes.
- Keep modules focused.
- Write reusable components.
- Validate external input.
- Handle failures explicitly.
- Use environment variables for secrets.
- Never hard-code production credentials.
- Add tests alongside major features.
- Document non-obvious architectural decisions.

Before creating a new library, determine whether the existing stack already solves the problem.

Avoid unnecessary dependencies.

---

# 42. AI Development Rules

You are not allowed to generate thousands of lines of code without explaining the architecture.

At every major phase:

1. Show the intended architecture.
2. Show the relevant folder structure.
3. Explain the data flow.
4. Implement the feature.
5. Test it.
6. Review the implementation.
7. Identify weaknesses.
8. Improve them.
9. Report exactly what remains.

When a task is too large, break it into smaller implementation tasks automatically.

Never say:

> "Everything is complete"

unless the feature is genuinely implemented and tested.

Never create fake implementations disguised as production implementations.

For integrations requiring API keys, infrastructure accounts, payment credentials, cloud services, Apple/Google credentials, CDN credentials, or external dashboards, create the integration interface and clearly mark the required external configuration.

---

# 43. UI/UX Review Mode

After each major frontend phase, act as a senior UI/UX reviewer.

Evaluate:

```text
Hierarchy
Spacing
Typography
Consistency
Accessibility
Navigation
Mobile Responsiveness
Loading States
Error States
Empty States
Interaction Design
Performance
```

Then improve the UI before proceeding.

Do not accept a merely functional UI.

---

# 44. Senior Architecture Review Mode

After every major backend phase, act as a principal architect.

Ask:

```text
Will this scale?
Is the database design correct?
Are there security problems?
Is business logic properly separated?
Are APIs consistent?
Can this later become distributed?
What will break first?
```

Fix architectural problems immediately.

---

# 45. Final Product Standard

The finished platform should feel like a legitimate technology company product rather than a student project.

It must have:

```text
Professional UI
Professional API
Professional database architecture
Secure authentication
Reliable video processing
Fast video delivery
Creator tools
Analytics
Moderation
Monetization
Mobile apps
Scalable infrastructure
Automated testing
Monitoring
Documentation
```

The final architecture should allow the platform to evolve from:

```text
10 users
```

to:

```text
1,000 users
```

then:

```text
100,000 users
```

then:

```text
1,000,000+ users
```

without requiring a complete rewrite.

---

# 46. First Task

Do **not** start coding the entire platform.

Start with **PHASE 0 only**.

Produce:

1. Product Requirements Document
2. System Architecture
3. Component Architecture
4. Database Entity Model
5. API Architecture
6. Video Processing Architecture
7. Authentication Architecture
8. UX Information Architecture
9. Design System Specification
10. Security Architecture
11. Deployment Architecture
12. Development Roadmap

Then stop.

Do not proceed to Phase 1 until Phase 0 has been fully reviewed and the architecture is internally consistent.

For every subsequent phase, follow the same disciplined process and maintain consistency with all previous architectural decisions.

Your goal is not merely to produce code.

Your goal is to build a **real, scalable, secure, commercially viable video platform** that could eventually compete with YouTube.