import Link from "next/link";
import Image from "next/image";
import { MoreVertical } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  duration: string;        // e.g. "12:34"
  channelName: string;
  channelAvatarUrl?: string | null;
  channelId: string;
  viewCount: number;
  publishedAt: string;     // ISO date string
  isLive?: boolean;
  className?: string;
  compact?: boolean;       // Compact row variant (search results, sidebar)
  href?: string;           // Override default watch href
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years  = Math.floor(days / 365);
  if (mins < 60)    return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24)   return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7)     return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (weeks < 5)    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  if (months < 12)  return `${months} month${months !== 1 ? "s" : ""} ago`;
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export function VideoCard({
  id,
  title,
  thumbnailUrl,
  duration,
  channelName,
  channelAvatarUrl,
  channelId,
  viewCount,
  publishedAt,
  isLive = false,
  className,
  compact = false,
  href,
}: VideoCardProps) {
  const watchHref = href ?? `/watch/${id}`;
  if (compact) {
    return (
      <Link
        href={watchHref}
        className={cn("flex gap-3 group hover:bg-surface-elevated rounded-lg p-2 transition-colors", className)}
        id={`video-card-compact-${id}`}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-40 aspect-video rounded-md overflow-hidden bg-surface-elevated">
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={title} fill className="object-cover" sizes="160px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-content-tertiary">▶</div>
          )}
          <span className="absolute bottom-1 right-1 duration-badge">
            {isLive ? "LIVE" : duration}
          </span>
        </div>
        {/* Info */}
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-medium text-content-primary line-clamp-2 leading-snug">
            {title}
          </h3>
          <Link href={`/channel/${channelId}`} className="text-xs text-content-muted hover:text-content-primary">
            {channelName}
          </Link>
          <p className="text-xs text-content-muted">
            {formatViews(viewCount)} · {timeAgo(publishedAt)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <article
      className={cn("flex flex-col gap-3 group", className)}
      id={`video-card-${id}`}
    >
      {/* Thumbnail */}
      <Link href={watchHref} className="block relative aspect-video rounded-lg overflow-hidden bg-surface-elevated">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-slow group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-content-tertiary text-3xl">▶</div>
        )}
        {/* Duration / Live badge */}
        <span
          className={cn(
            "absolute bottom-2 right-2 duration-badge",
            isLive && "bg-status-error"
          )}
        >
          {isLive ? "● LIVE" : duration}
        </span>
      </Link>

      {/* Meta row */}
      <div className="flex gap-3">
        <Link href={`/channel/${channelId}`} className="shrink-0">
          <Avatar
            src={channelAvatarUrl}
            alt={channelName}
            size="sm"
            className="hover:ring-brand-primary hover:ring-2"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={watchHref}>
            <h3 className="text-sm font-medium text-content-primary line-clamp-2 leading-snug hover:text-brand-text transition-colors">
              {title}
            </h3>
          </Link>
          <Link
            href={`/channel/${channelId}`}
            className="mt-0.5 block text-xs text-content-muted hover:text-content-primary transition-colors"
          >
            {channelName}
          </Link>
          <p className="mt-0.5 text-xs text-content-muted">
            {formatViews(viewCount)} · {timeAgo(publishedAt)}
          </p>
        </div>
        {/* Options menu */}
        <button
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md
                     text-content-muted hover:text-content-primary hover:bg-surface-elevated -mt-1 -mr-1"
          aria-label="More options"
          id={`video-options-${id}`}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
