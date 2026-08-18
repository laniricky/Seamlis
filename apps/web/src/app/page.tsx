import { AppShell } from "@/components/layout/AppShell";
import { VideoCard } from "@/components/ui/VideoCard";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

// Sample data for the Phase 2 design showcase
const SAMPLE_VIDEOS = [
  {
    id: "v1",
    title: "Building a Full-Stack Video Platform from Scratch with Next.js and Ktor",
    thumbnailUrl: "https://picsum.photos/seed/v1/640/360",
    duration: "42:15",
    channelName: "DevStudio",
    channelAvatarUrl: "https://picsum.photos/seed/ch1/40/40",
    channelId: "c1",
    viewCount: 1_240_000,
    publishedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  },
  {
    id: "v2",
    title: "HLS Video Streaming Explained — Adaptive Bitrate in 20 Minutes",
    thumbnailUrl: "https://picsum.photos/seed/v2/640/360",
    duration: "19:48",
    channelName: "StreamCodex",
    channelAvatarUrl: "https://picsum.photos/seed/ch2/40/40",
    channelId: "c2",
    viewCount: 325_000,
    publishedAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
  },
  {
    id: "v3",
    title: "PostgreSQL Performance Tuning: Indexes, Partitioning & Connection Pooling",
    thumbnailUrl: "https://picsum.photos/seed/v3/640/360",
    duration: "1:05:22",
    channelName: "DBExpert",
    channelAvatarUrl: "https://picsum.photos/seed/ch3/40/40",
    channelId: "c3",
    viewCount: 98_200,
    publishedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  },
  {
    id: "v4",
    title: "Kotlin Coroutines Deep Dive — Suspending Functions, Flows and Channels",
    thumbnailUrl: "https://picsum.photos/seed/v4/640/360",
    duration: "34:07",
    channelName: "KotlinHub",
    channelAvatarUrl: "https://picsum.photos/seed/ch4/40/40",
    channelId: "c4",
    viewCount: 212_900,
    publishedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: "v5",
    title: "Redis: Caching Strategies, Data Structures and TTL Management at Scale",
    thumbnailUrl: "https://picsum.photos/seed/v5/640/360",
    duration: "28:33",
    channelName: "CacheKing",
    channelAvatarUrl: "https://picsum.photos/seed/ch5/40/40",
    channelId: "c5",
    viewCount: 67_400,
    publishedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
  {
    id: "v6",
    title: "Live: Building the Seamlis Design System — Components & Dark Mode",
    thumbnailUrl: "https://picsum.photos/seed/v6/640/360",
    duration: "2:14:00",
    channelName: "Seamlis Team",
    channelAvatarUrl: "https://picsum.photos/seed/ch6/40/40",
    channelId: "c6",
    viewCount: 4_820,
    publishedAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
    isLive: true,
  },
];

const CATEGORIES = ["All", "For You", "Tech", "Gaming", "Music", "Education", "Live"];

export default function HomePage() {
  return (
    <AppShell user={null}>
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat}
            id={`category-chip-${cat.toLowerCase()}`}
            className={
              i === 0
                ? "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-brand-primary text-white transition-all"
                : "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-surface-elevated text-content-secondary hover:bg-[var(--bg-elevated)] hover:text-content-primary transition-all"
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold font-display text-content-primary">
          Trending Now
        </h1>
        <Badge variant="green" dot>Live Feed</Badge>
      </div>

      {/* Video grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        id="video-grid"
      >
        {SAMPLE_VIDEOS.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
        {/* Skeleton placeholders for "loading" effect demo */}
        <VideoCardSkeleton />
        <VideoCardSkeleton />
      </div>
    </AppShell>
  );
}
