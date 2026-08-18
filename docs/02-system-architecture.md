# Seamlis — System Architecture

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Architecture Overview

Seamlis is designed as a **modular monolith** initially. The modules are internally decoupled so that individual services can be extracted as separate deployments when scale demands it — without requiring a full rewrite.

### Core Principles

1. **CDN-first video delivery** — Video bytes never route through the application server
2. **API-first** — Web, Android, and iOS all consume the same versioned REST API
3. **Async processing** — Video transcoding happens via a job queue, never in the request path
4. **Stateless API servers** — Sessions stored in Redis, enabling horizontal scaling
5. **Database as source of truth** — Business logic lives in the backend, not clients

---

## 2. High-Level System Diagram

```
                          ┌─────────────────────────────────────────┐
                          │                  USERS                   │
                          └──────────┬────────────┬─────────────────┘
                                     │            │
                          ┌──────────▼──┐    ┌───▼──────────┐
                          │  Web App    │    │  Mobile Apps  │
                          │  (Next.js)  │    │  Android/iOS  │
                          └──────────┬──┘    └───┬──────────┘
                                     │            │
                          ┌──────────▼────────────▼─────────────────┐
                          │              Cloudflare CDN              │
                          │      (Static assets + API gateway)       │
                          └──────────┬────────────────────┬──────────┘
                                     │                    │
                          ┌──────────▼──────┐    ┌────────▼─────────┐
                          │   Ktor API      │    │   Object Storage  │
                          │   (Modular      │    │   (S3-compatible) │
                          │    Monolith)    │    │                   │
                          └──┬──────┬──────┘    └────────┬──────────┘
                             │      │                    │
                ┌────────────▼──┐ ┌─▼──────────┐  ┌─────▼─────────────┐
                │  PostgreSQL   │ │    Redis    │  │  Video Processing  │
                │  (Primary DB) │ │  (Cache +  │  │  Worker (FFmpeg)   │
                │               │ │   Queue)   │  │                   │
                └───────────────┘ └────────────┘  └───────────────────┘
                                                          │
                                                  ┌───────▼───────────┐
                                                  │   HLS Segments    │
                                                  │   (Object Store)  │
                                                  └───────────────────┘
                                                          │
                                                  ┌───────▼───────────┐
                                                  │   CDN Edge Nodes  │
                                                  │   (Video Delivery)│
                                                  └───────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Client Layer

| Client | Technology | Responsibility |
|--------|-----------|----------------|
| Web App | Next.js 14+ (App Router), TypeScript, Tailwind CSS | Primary web experience, SSR for SEO |
| Android | Kotlin, Jetpack Compose | Native Android experience |
| iOS | Swift, SwiftUI, AVFoundation | Native iOS experience |

**Shared across clients:**
- API contracts (REST, versioned)
- Authentication flow (JWT)
- Design tokens (color, spacing, typography)

### 3.2 CDN Layer

**Provider:** Cloudflare (or equivalent)

**Responsibilities:**
- Static asset delivery (JS, CSS, images)
- Video HLS segment delivery
- DDoS protection
- Bot mitigation
- API edge caching (selected endpoints)

**CDN does NOT cache:**
- Authentication endpoints
- Write endpoints (POST/PUT/DELETE)
- Personalized feed data

### 3.3 API Layer — Ktor Backend

**Language:** Kotlin  
**Framework:** Ktor  
**Architecture:** Modular monolith

Modules (each a Kotlin module/package with clear boundaries):

```
backend/
├── api/
│   ├── auth/          ← Authentication, sessions, JWT
│   ├── users/         ← User profiles, preferences
│   ├── channels/      ← Channel CRUD, subscriptions
│   ├── videos/        ← Video CRUD, metadata
│   ├── processing/    ← Upload coordination, job dispatch
│   ├── player/        ← Playback URLs, view tracking
│   ├── comments/      ← Comments, replies, likes
│   ├── search/        ← Search endpoints
│   ├── feed/          ← Home feed, recommendations
│   ├── shorts/        ← Shorts feed
│   ├── live/          ← Livestream management
│   ├── notifications/ ← Notification dispatch
│   ├── community/     ← Community posts
│   ├── moderation/    ← Reports, review queue
│   ├── analytics/     ← Event ingestion, aggregation
│   ├── monetization/  ← Tips, memberships, ads
│   ├── admin/         ← Admin console APIs
│   └── health/        ← Health checks, metrics
```

### 3.4 Database Layer — PostgreSQL

**Version:** PostgreSQL 16+  
**Hosting (dev):** Neon (serverless Postgres)  
**Hosting (prod):** Managed PostgreSQL (AWS RDS, Neon, or self-hosted)

**Connection pooling:** PgBouncer (transaction mode)  
**Migrations:** Flyway or Exposed migrations

### 3.5 Cache Layer — Redis

**Version:** Redis 7+  
**Usage:**

| Use Case | TTL | Key Pattern |
|----------|-----|-------------|
| Session tokens | 30 days | `session:{token}` |
| User profile cache | 5 min | `user:{id}` |
| Video metadata cache | 2 min | `video:{id}` |
| Feed cache | 30 sec | `feed:{user_id}:{cursor}` |
| Rate limiting | Per window | `ratelimit:{ip}:{endpoint}` |
| Job queue | — | `queue:video_processing` |
| View count buffer | 60 sec flush | `views:buffer:{video_id}` |

### 3.6 Object Storage — S3-Compatible

**Provider:** AWS S3, Cloudflare R2, or MinIO (self-hosted for dev)

**Bucket Structure:**

```
seamlis-media/
├── videos/
│   ├── raw/{video_id}/original.{ext}        ← Raw upload (temporary)
│   └── processed/{video_id}/
│       ├── hls/
│       │   ├── master.m3u8
│       │   ├── 1080p/
│       │   │   ├── index.m3u8
│       │   │   └── segment_*.ts
│       │   ├── 720p/
│       │   └── ...
│       └── thumbnails/
│           ├── auto_{timestamp}.jpg
│           └── selected.jpg
├── avatars/{user_id}/{size}.jpg
├── banners/{channel_id}/banner.jpg
└── community/{post_id}/{asset_id}.jpg
```

**Access Pattern:**
- Raw uploads: Direct upload via pre-signed URL (client → S3 directly)
- Processed video: Public access via CDN (CDN → S3)
- Avatars/banners: Public access via CDN
- Raw files: Private, accessible only to processing workers

### 3.7 Video Processing Workers

**Technology:** Kotlin service + FFmpeg subprocess  
**Queue:** Redis-backed job queue (initially); designed to migrate to Kafka

**Processing Pipeline:** See [Video Processing Architecture](./06-video-processing-architecture.md)

---

## 4. Data Flow Diagrams

### 4.1 Video Watch Flow

```
User clicks video
      │
      ▼
Next.js SSR renders watch page (title, metadata from API)
      │
      ▼
Client requests playback URL from API
      │
API returns: CDN URL for master.m3u8
      │
      ▼
HLS.js / native player fetches master.m3u8 from CDN
      │
CDN serves segments from Object Storage
      │
      ▼
Parallel: Client sends view event to API
      │
API buffers view in Redis (prevents refresh inflation)
      │
Redis flush job → PostgreSQL view count update
```

### 4.2 Video Upload Flow

```
Creator selects file
      │
      ▼
API: Create video record (status: UPLOADING) → returns video_id + pre-signed S3 URL
      │
      ▼
Client uploads file directly to S3 (no API intermediary)
      │
      ▼
Client notifies API: Upload complete
      │
      ▼
API: Update status → PROCESSING, dispatch job to Redis queue
      │
      ▼
Processing worker picks up job
      │
FFmpeg: validate → transcode → package HLS → generate thumbnails
      │
      ▼
Worker: Upload HLS segments to S3
      │
      ▼
Worker: Notify API via callback/polling → status = READY
      │
      ▼
API: Update video record (status: READY, assets created)
      │
      ▼
Creator notified (in-app + email)
```

### 4.3 Authentication Flow

```
User submits credentials
      │
      ▼
API: Validate credentials, check account status
      │
      ▼
API: Issue JWT access token (15 min) + refresh token (30 days)
      │
Refresh token stored in Redis (session:{token_hash}) + HttpOnly cookie
Access token returned in response body
      │
      ▼
Client stores access token in memory (not localStorage)
      │
On expiry: Client uses refresh token → new access token issued
      │
On logout: Refresh token deleted from Redis → session invalidated
```

---

## 5. Future Service Extraction Strategy

As the platform scales, modules can be extracted in this recommended order:

```
Priority 1 (high traffic): Video Service, Feed Service, Search Service
Priority 2 (high compute): Processing Worker (already separate), Live Service
Priority 3 (compliance): Auth Service, Moderation Service
Priority 4 (business): Monetization Service, Analytics Service
Priority 5 (support): Notification Service, Community Service
```

Each module boundary is designed with:
- Clear domain events (publishable to Kafka when ready)
- Isolated database schemas (no cross-module joins in business logic)
- API contracts that don't leak internal implementation

---

## 6. Technology Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Web Frontend | Next.js | 14+ |
| Web Language | TypeScript | 5+ |
| Web Styling | Tailwind CSS | 3+ |
| State Management | TanStack Query | 5+ |
| Validation | Zod | 3+ |
| Backend | Ktor | 2.x |
| Backend Language | Kotlin | 1.9+ |
| Database | PostgreSQL | 16+ |
| Cache | Redis | 7+ |
| Object Storage | S3-compatible | — |
| Video Processing | FFmpeg | 6+ |
| Streaming Protocol | HLS | — |
| CDN | Cloudflare | — |
| Containerization | Docker | 24+ |
| Android | Kotlin + Jetpack Compose | — |
| iOS | Swift + SwiftUI | — |

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [Product Requirements ←](./01-product-requirements.md) | Next: [Component Architecture →](./03-component-architecture.md)*
