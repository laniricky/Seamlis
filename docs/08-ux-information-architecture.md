# Seamlis — UX Information Architecture

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Design Philosophy

Seamlis does not copy YouTube's UI pixel-for-pixel. Instead it derives its design from first principles:

**Core UX Values:**
- **Discoverable** — Content should be easy to find. Interface should not hide actions.
- **Fast** — Every interaction should feel instant. Loading states should be minimal and informative.
- **Creator-first** — Creators should always understand how their content is performing.
- **Clean** — No visual clutter. Green is used sparingly and purposefully.
- **Mobile-native** — Designed mobile-first; desktop is an enhancement, not the default.

**What we avoid:**
- Dark patterns (misleading subscription prompts, forced autoplay without context)
- Infinite scroll without opt-out
- Notification spam
- Buried settings

---

## 2. User Navigation Architecture

### 2.1 Web Navigation (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  [Logo]  [Search Bar]  [Upload] [Notifications] [Avatar Menu]   │
└─────────────────────────────────────────────────────────────────┘
│                    │
│  SIDEBAR           │  MAIN CONTENT AREA
│  (collapsible)     │
│                    │
│  Home              │
│  Shorts            │
│  Subscriptions     │
│  Live              │
│  ──────────        │
│  History           │
│  Watch Later       │
│  Playlists         │
│  ──────────        │
│  Subscriptions     │
│  [channel list]    │
│  ──────────        │
│  Explore           │
│  Trending          │
│  Music             │
│  Gaming            │
│  News              │
│  ──────────        │
│  Creator Studio    │
│  Settings          │
│  Help              │
```

### 2.2 Mobile Navigation (Bottom Tab Bar)

```
┌─────────────────────────────────────────────────────┐
│                  CONTENT AREA                        │
└─────────────────────────────────────────────────────┘
│  Home  │  Shorts  │  [+Create]  │  Subscriptions  │  You  │
```

**Tab definitions:**
- **Home** — Personalized feed
- **Shorts** — Full-screen vertical feed
- **+ Create** — Upload / Go Live (center action button, green)
- **Subscriptions** — Chronological subscription feed
- **You** — Profile, watch history, playlists, settings

### 2.3 Authenticated vs Anonymous Navigation

| Element | Anonymous | Authenticated |
|---------|-----------|---------------|
| Home feed | Trending/popular | Personalized |
| Subscriptions tab | Hidden | Visible |
| Notifications | Hidden | Visible |
| Upload button | Hidden | Visible (creators) |
| Watch later | Hidden | Visible |
| Watch history | Hidden | Visible |
| Like/comment | Prompts sign-up | Works |

---

## 3. Page Hierarchy

### 3.1 Core Pages

```
/ (Home Feed)
├── /shorts                          Shorts feed (full-screen)
├── /live                            Live feed
├── /trending                        Trending videos
├── /search?q=...                    Search results
│
├── /watch/:videoId                  Video watch page
│
├── /channel/:handle                 Channel page
│   ├── /channel/:handle/videos
│   ├── /channel/:handle/shorts
│   ├── /channel/:handle/live
│   ├── /channel/:handle/playlists
│   └── /channel/:handle/community
│
├── /playlist/:playlistId            Playlist page
│
├── (auth)
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   └── /reset-password
│
├── /settings
│   ├── /settings/account
│   ├── /settings/privacy
│   ├── /settings/notifications
│   └── /settings/appearance
│
├── /studio (Creator Studio — separate layout)
│   ├── /studio (Dashboard)
│   ├── /studio/content
│   ├── /studio/analytics
│   ├── /studio/comments
│   ├── /studio/community
│   ├── /studio/live
│   ├── /studio/monetization
│   └── /studio/settings
│
└── /admin (Admin Console — separate layout, admin only)
    ├── /admin
    ├── /admin/users
    ├── /admin/channels
    ├── /admin/videos
    ├── /admin/moderation
    ├── /admin/payments
    └── /admin/analytics
```

---

## 4. Screen Specifications

### 4.1 Home Feed

**Purpose:** Primary content discovery  
**Sections:**
1. **Category chips** (scrollable horizontal): All, Gaming, Music, News, Tech, Cooking, Sports, ...
2. **Featured/Hero** (optional, signed-in): New from subscriptions
3. **Recommended grid** (infinite scroll, cursor pagination)
4. **Shorts row** (horizontal scroll, links to /shorts)
5. **Live now row** (if active streams exist)

**Video card layout (default grid):**
```
┌─────────────────────────────────┐
│         THUMBNAIL (16:9)         │   Duration badge (bottom right)
│                                 │
└─────────────────────────────────┘
[Avatar]  Title (2 lines max)
          Channel Name · 125K views · 3 days ago  [⋮ Menu]
```

### 4.2 Watch Page

**Purpose:** Core video viewing experience  
**Layout (desktop, two-column):**

```
┌────────────────────────────────────────────┬─────────────────────┐
│                                            │  RECOMMENDED        │
│           VIDEO PLAYER                     │  [VideoCard]        │
│                                            │  [VideoCard]        │
├────────────────────────────────────────────│  [VideoCard]        │
│  Title                                     │  [VideoCard]        │
│  123,456 views · Aug 18, 2026              │  ...                │
│  ────────────────────────────────────────  │                     │
│  [Avatar] Channel Name [Subscribe] [Bell]  │                     │
│  ────────────────────────────────────────  │                     │
│  [👍 45K] [👎] [Share] [Save] [...]        │                     │
│  ────────────────────────────────────────  │                     │
│  Description (expandable)                  │                     │
│  ────────────────────────────────────────  │                     │
│  Comments (123)                            │                     │
│  [Comment input]                           │                     │
│  [Comment] [Comment] ...                   │                     │
└────────────────────────────────────────────┴─────────────────────┘
```

**Mobile layout:** Single column; recommended videos below comments.

### 4.3 Shorts Feed

**Purpose:** Full-screen vertical video discovery  
**Interaction:** Swipe up/down to navigate  
**Controls (overlaid):**
- Bottom: Channel name, caption, music info
- Right side: Like, Comment, Share, Subscribe button, channel avatar

### 4.4 Channel Page

**Tabs:** Videos | Shorts | Live | Playlists | Community  
**Header:** Banner image, avatar, name, subscriber count, subscribe button, links

### 4.5 Creator Studio Dashboard

**Sections:**
1. **Quick metrics bar:** Views last 28d, Watch time, Subscribers gained, Revenue
2. **Recent video performance table:** Title, Views, CTR, Watch time
3. **Latest comments** needing response
4. **Analytics trend chart** (views over time)

### 4.6 Search Results Page

**Layout:** Filters bar + results list  
**Filters:** Type (Video/Channel/Short/Live), Upload date, Duration, Sort by  
**Result types:**
- Videos: full VideoCard
- Channels: ChannelCard (avatar, name, sub count, description snippet, subscribe button)
- Playlists: Playlist card (thumbnail grid, title, count)

---

## 5. Key UI States (Required for Every Component)

Every content-loading component must handle:

| State | Visual Treatment |
|-------|-----------------|
| **Loading** | Skeleton screens (animated shimmer, matches content shape) |
| **Empty** | Illustrated empty state with action CTA |
| **Error** | Error illustration, error message, retry button |
| **Success** | Content rendered |

**Example empty states:**
- Home feed (new user): "Start exploring — here's what's trending"
- Subscriptions feed: "Subscribe to channels to see their latest videos here"
- Watch history: "Your watched videos will appear here"
- Creator Studio (no videos): "Upload your first video to get started"

---

## 6. Responsive Layout Breakpoints

```css
/* Mobile first */
sm: 640px    /* Large mobile / small tablet */
md: 768px    /* Tablet portrait */
lg: 1024px   /* Tablet landscape / small desktop */
xl: 1280px   /* Desktop */
2xl: 1536px  /* Wide desktop */
```

### Feed Column Counts

| Breakpoint | Home Feed Columns | Studio Content Columns |
|-----------|------------------|----------------------|
| Mobile (<640px) | 1 | 1 |
| sm (640px+) | 2 | 1 |
| md (768px+) | 2 | 2 |
| lg (1024px+) | 3 | 3 |
| xl (1280px+) | 4 | 4 |

---

## 7. Navigation Patterns

### 7.1 Breadcrumbs
Used in Studio and Admin sections only. Not on public-facing pages.

### 7.2 Back Navigation
- Web: Browser native back + "Back to Channel" contextual link on Watch page
- Mobile: OS-native back gesture/button

### 7.3 Search UX
- Search bar always visible in header (web/tablet+)
- Mobile: Search icon that expands to full-width input
- Autocomplete suggestions appear after 2+ characters
- Recent searches shown when search focused (empty query)
- Search history clears independently

---

## 8. Notification UX

**Bell icon in header:**
- Shows unread count badge (capped at 99+)
- Clicking opens notification panel/dropdown
- Notifications grouped by day
- Each notification links to relevant content

**Mobile:**
- Push notification → opens relevant deep link in app

---

## 9. Upload UX

**Entry points:**
- Header "Upload" button (desktop)
- "+" center tab (mobile)

**Upload flow:**
```
1. File picker / Drag-and-drop zone
2. Upload progress (real-time percentage + ETA)
3. Processing progress (polling status)
4. Form: Title*, Description, Thumbnail selection, Tags, Category, Visibility
5. Schedule / Publish
```

**Progress indicators:**
- Upload phase: Linear progress bar (0-100%)
- Processing phase: Animated pulse with status text ("Processing...", "Almost ready...")
- Ready: Green checkmark + "Video is live" toast

---

## 10. Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements reachable via Tab; focus ring visible |
| Screen reader | ARIA labels on all icons, buttons, dynamic content |
| Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| Touch targets | Minimum 44×44px on mobile |
| Reduced motion | `prefers-reduced-motion` media query respected; animations disabled |
| Captions | Player shows CC button; auto-captions indicated |
| Focus management | Modal opens focus within modal; closes focus returns to trigger |

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [Authentication Architecture ←](./07-authentication-architecture.md) | Next: [Design System Specification →](./09-design-system-specification.md)*
