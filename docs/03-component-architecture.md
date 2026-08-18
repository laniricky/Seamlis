# Seamlis — Component Architecture

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Backend Component Architecture

### 1.1 Module Structure

The Ktor backend is organized as a **modular monolith**. Each module is a Kotlin package with clear internal structure and no cross-module database joins in business logic layer.

```
backend/api/
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   └── com/seamlis/
│   │   │       ├── Application.kt              ← Entry point, module wiring
│   │   │       ├── config/                     ← App config (env vars, DB, Redis)
│   │   │       ├── plugins/                    ← Ktor plugins (auth, routing, cors, etc.)
│   │   │       ├── shared/
│   │   │       │   ├── database/               ← DB connection, transaction helpers
│   │   │       │   ├── redis/                  ← Redis client wrappers
│   │   │       │   ├── storage/                ← S3 client wrappers
│   │   │       │   ├── queue/                  ← Job queue interface
│   │   │       │   ├── pagination/             ← Cursor pagination utilities
│   │   │       │   ├── validation/             ← Input validation helpers
│   │   │       │   ├── errors/                 ← Error types + HTTP error mapper
│   │   │       │   └── extensions/             ← Kotlin extension functions
│   │   │       │
│   │   │       ├── auth/
│   │   │       │   ├── AuthRoutes.kt
│   │   │       │   ├── AuthService.kt
│   │   │       │   ├── TokenService.kt
│   │   │       │   ├── PasswordService.kt
│   │   │       │   ├── SessionService.kt
│   │   │       │   └── models/
│   │   │       │       ├── AuthRequest.kt
│   │   │       │       └── AuthResponse.kt
│   │   │       │
│   │   │       ├── users/
│   │   │       │   ├── UserRoutes.kt
│   │   │       │   ├── UserService.kt
│   │   │       │   ├── UserRepository.kt
│   │   │       │   └── models/
│   │   │       │       ├── User.kt
│   │   │       │       └── UserDTO.kt
│   │   │       │
│   │   │       ├── channels/
│   │   │       │   ├── ChannelRoutes.kt
│   │   │       │   ├── ChannelService.kt
│   │   │       │   ├── ChannelRepository.kt
│   │   │       │   ├── SubscriptionService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── videos/
│   │   │       │   ├── VideoRoutes.kt
│   │   │       │   ├── VideoService.kt
│   │   │       │   ├── VideoRepository.kt
│   │   │       │   ├── ViewTrackingService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── processing/
│   │   │       │   ├── UploadRoutes.kt
│   │   │       │   ├── UploadService.kt
│   │   │       │   ├── ProcessingJobService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── comments/
│   │   │       │   ├── CommentRoutes.kt
│   │   │       │   ├── CommentService.kt
│   │   │       │   ├── CommentRepository.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── search/
│   │   │       │   ├── SearchRoutes.kt
│   │   │       │   ├── SearchService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── feed/
│   │   │       │   ├── FeedRoutes.kt
│   │   │       │   ├── FeedService.kt
│   │   │       │   ├── RecommendationEngine.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── shorts/
│   │   │       │   ├── ShortsRoutes.kt
│   │   │       │   └── ShortsService.kt
│   │   │       │
│   │   │       ├── live/
│   │   │       │   ├── LiveRoutes.kt
│   │   │       │   ├── LiveService.kt
│   │   │       │   ├── LiveChatService.kt (WebSocket)
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── notifications/
│   │   │       │   ├── NotificationRoutes.kt
│   │   │       │   ├── NotificationService.kt
│   │   │       │   ├── PushService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── community/
│   │   │       │   ├── CommunityRoutes.kt
│   │   │       │   ├── CommunityService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── moderation/
│   │   │       │   ├── ModerationRoutes.kt
│   │   │       │   ├── ModerationService.kt
│   │   │       │   ├── ReportService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── analytics/
│   │   │       │   ├── AnalyticsRoutes.kt
│   │   │       │   ├── AnalyticsService.kt
│   │   │       │   ├── EventIngestionService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       ├── monetization/
│   │   │       │   ├── MonetizationRoutes.kt
│   │   │       │   ├── TipService.kt
│   │   │       │   ├── MembershipService.kt
│   │   │       │   ├── LedgerService.kt
│   │   │       │   └── models/
│   │   │       │
│   │   │       └── admin/
│   │   │           ├── AdminRoutes.kt
│   │   │           ├── AdminUserService.kt
│   │   │           ├── AdminVideoService.kt
│   │   │           └── models/
│   │   │
│   │   └── resources/
│   │       ├── application.conf
│   │       └── logback.xml
│   │
│   └── test/
│       └── kotlin/com/seamlis/
│           ├── auth/
│           ├── videos/
│           ├── channels/
│           └── ...
│
├── build.gradle.kts
└── Dockerfile
```

### 1.2 Backend Dependency Rules

```
Routes → Service → Repository → Database
Routes → Service → Queue (for async work)
Routes → Service → ExternalService (S3, Redis, Push)

✅ Service can call another Service if needed
✅ Repository only talks to the database
❌ Repository must NOT call another Repository from a different module
❌ Routes must NOT contain business logic
❌ Services must NOT know about HTTP (no HttpStatusCode in service layer)
```

---

## 2. Web Frontend Component Architecture

### 2.1 Next.js App Router Structure

```
apps/web/
├── app/
│   ├── layout.tsx                     ← Root layout (theme, providers)
│   ├── page.tsx                       ← Home feed (/)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── watch/[videoId]/page.tsx       ← Video watch page
│   ├── shorts/page.tsx                ← Shorts feed
│   ├── live/page.tsx                  ← Live feed
│   ├── search/page.tsx                ← Search results
│   ├── channel/[handle]/
│   │   ├── page.tsx                   ← Channel home
│   │   ├── videos/page.tsx
│   │   ├── shorts/page.tsx
│   │   ├── live/page.tsx
│   │   ├── playlists/page.tsx
│   │   └── community/page.tsx
│   ├── studio/
│   │   ├── layout.tsx                 ← Studio sidebar layout
│   │   ├── page.tsx                   ← Studio dashboard
│   │   ├── content/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── comments/page.tsx
│   │   ├── community/page.tsx
│   │   ├── live/page.tsx
│   │   ├── monetization/page.tsx
│   │   └── settings/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [section]/page.tsx
│   ├── settings/
│   │   └── [section]/page.tsx
│   └── api/                           ← Next.js API routes (proxies only, no business logic)
│
├── components/
│   ├── ui/                            ← Design system primitives
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Skeleton/
│   │   ├── Dropdown/
│   │   ├── Tabs/
│   │   ├── Progress/
│   │   └── ...
│   │
│   ├── layout/                        ← Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── MobileNav/
│   │   └── StudioSidebar/
│   │
│   ├── video/                         ← Video-specific components
│   │   ├── VideoCard/                 ← Feed card
│   │   ├── VideoPlayer/               ← HLS player wrapper
│   │   ├── VideoGrid/                 ← Grid/list layout
│   │   ├── VideoUploader/             ← Upload UI
│   │   ├── VideoThumbnail/
│   │   └── VideoDuration/
│   │
│   ├── channel/
│   │   ├── ChannelCard/
│   │   ├── ChannelBanner/
│   │   ├── SubscribeButton/
│   │   └── ChannelStats/
│   │
│   ├── comment/
│   │   ├── CommentSection/
│   │   ├── CommentItem/
│   │   ├── CommentForm/
│   │   └── CommentThread/
│   │
│   ├── feed/
│   │   ├── HomeFeed/
│   │   ├── ShortsFeed/
│   │   ├── SubscriptionFeed/
│   │   └── CategoryFilter/
│   │
│   └── studio/
│       ├── AnalyticsChart/
│       ├── VideoTable/
│       └── MetricCard/
│
├── hooks/                             ← Custom React hooks
│   ├── useAuth.ts
│   ├── useInfiniteScroll.ts
│   ├── useVideoPlayer.ts
│   ├── useNotifications.ts
│   └── useTheme.ts
│
├── lib/
│   ├── api/                           ← API client (typed fetch wrappers)
│   │   ├── client.ts
│   │   ├── videos.ts
│   │   ├── channels.ts
│   │   ├── auth.ts
│   │   └── ...
│   ├── stores/                        ← Zustand stores (client state)
│   │   ├── authStore.ts
│   │   └── playerStore.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
│
├── types/                             ← TypeScript type definitions
│   ├── api.ts
│   ├── video.ts
│   ├── user.ts
│   └── ...
│
└── public/
    ├── icons/
    └── images/
```

### 2.2 Component Design Principles

- **Every component has a single responsibility**
- **No business logic in components** — use hooks and API layer
- **Props are typed strictly** — no `any`, no `object`
- **Loading, error, and empty states** are explicit, not afterthoughts
- **Components are independently testable**

---

## 3. Android Component Architecture

### 3.1 Module Structure

```
apps/android/
├── app/
│   └── src/main/
│       └── java/com/seamlis/
│           ├── SeamlisApp.kt          ← Application class
│           ├── MainActivity.kt
│           │
│           ├── navigation/
│           │   └── NavGraph.kt        ← Compose Navigation graph
│           │
│           ├── di/                    ← Hilt dependency injection
│           │   ├── NetworkModule.kt
│           │   ├── DatabaseModule.kt
│           │   └── RepositoryModule.kt
│           │
│           ├── data/
│           │   ├── api/               ← Retrofit interfaces
│           │   ├── local/             ← Room database (offline cache)
│           │   └── repository/        ← Repository implementations
│           │
│           ├── domain/
│           │   ├── model/             ← Domain models
│           │   └── usecase/           ← Business use cases
│           │
│           └── ui/
│               ├── theme/             ← Compose theme (colors, typography)
│               ├── components/        ← Shared composables
│               ├── home/
│               │   ├── HomeScreen.kt
│               │   └── HomeViewModel.kt
│               ├── watch/
│               ├── shorts/
│               ├── search/
│               ├── channel/
│               ├── studio/
│               ├── upload/
│               ├── live/
│               ├── notifications/
│               ├── profile/
│               └── settings/
```

**Architecture pattern:** MVVM + Clean Architecture (Data → Domain → UI)

### 3.2 Android State Flow

```
Repository → StateFlow → ViewModel → Composable (UI State)
User Action → ViewModel.onEvent() → Repository → StateFlow update → UI recompose
```

---

## 4. iOS Component Architecture

### 4.1 Module Structure

```
apps/ios/
└── Seamlis/
    ├── SeamlisApp.swift
    ├── ContentView.swift
    │
    ├── Navigation/
    │   └── AppRouter.swift
    │
    ├── Data/
    │   ├── Network/
    │   │   ├── APIClient.swift
    │   │   └── Endpoints/
    │   ├── Repository/
    │   └── Models/
    │
    ├── Domain/
    │   ├── Models/
    │   └── UseCases/
    │
    └── UI/
        ├── DesignSystem/
        │   ├── Colors.swift
        │   ├── Typography.swift
        │   └── Components/
        ├── Home/
        ├── Watch/
        ├── Shorts/
        ├── Search/
        ├── Channel/
        ├── Studio/
        ├── Upload/
        ├── Live/
        ├── Notifications/
        └── Profile/
```

**Architecture pattern:** MVVM with Swift Concurrency (async/await)

---

## 5. Shared Packages

```
packages/
├── api-contracts/             ← Shared type definitions (OpenAPI / generated types)
│   ├── openapi.yaml           ← Single source of truth for API schema
│   └── generated/
│       ├── typescript/        ← Auto-generated TypeScript types
│       └── kotlin/            ← Auto-generated Kotlin types
│
├── design-system/             ← Design tokens usable across platforms
│   ├── tokens/
│   │   ├── colors.json
│   │   ├── typography.json
│   │   └── spacing.json
│   └── web/                   ← Tailwind config + CSS variables
│
└── shared-types/              ← Cross-cutting types
    └── events/                ← Analytics event definitions
```

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [System Architecture ←](./02-system-architecture.md) | Next: [Database Entity Model →](./04-database-entity-model.md)*
