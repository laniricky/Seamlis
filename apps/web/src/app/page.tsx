'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { AppShell } from '@/components/layout/AppShell';
import { VideoCard } from '@/components/ui/VideoCard';
import { VideoCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { VideoResponse } from '@/types';
import { Sparkles, Flame, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const MINIO_BASE = 'http://localhost:9000/seamlis-videos';

const CATEGORIES = [
  { label: 'For You', icon: Sparkles },
  { label: 'Trending', icon: Flame },
  { label: 'New', icon: Clock },
  { label: 'Tech', icon: null },
  { label: 'Gaming', icon: null },
  { label: 'Music', icon: null },
  { label: 'Education', icon: null },
];

const LIMIT = 16;

export default function HomePage() {
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [activeCategory, setActiveCategory] = useState('For You');

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Determine the feed endpoint based on category
  const getFeedEndpoint = useCallback((cat: string, off: number) => {
    switch (cat) {
      case 'For You':
        return `/recommendations/feed?limit=${LIMIT}&offset=${off}`;
      case 'Trending':
        return `/videos?limit=${LIMIT}&offset=${off}`;
      case 'New':
        return `/videos?limit=${LIMIT}&offset=${off}`;
      default:
        return `/recommendations/feed?limit=${LIMIT}&offset=${off}`;
    }
  }, []);

  const loadMore = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (!reset && (!hasMore || loading)) return;

    setLoading(true);
    try {
      const endpoint = getFeedEndpoint(activeCategory, currentOffset);
      const newVideos = await fetchApi<VideoResponse[]>(endpoint);

      if (newVideos.length < LIMIT) setHasMore(false);

      setVideos(prev => {
        if (reset) return newVideos;
        const existingIds = new Set(prev.map(v => v.id));
        return [...prev, ...newVideos.filter(v => !existingIds.has(v.id))];
      });
      setOffset(currentOffset + newVideos.length);
    } catch (e) {
      console.error('Failed to fetch videos', e);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, offset, activeCategory, getFeedEndpoint]);

  // Reset + reload when category changes
  useEffect(() => {
    setVideos([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);

    const endpoint = getFeedEndpoint(activeCategory, 0);
    fetchApi<VideoResponse[]>(endpoint)
      .then(newVideos => {
        setVideos(newVideos);
        setOffset(newVideos.length);
        if (newVideos.length < LIMIT) setHasMore(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, getFeedEndpoint]);

  // Trigger load on scroll
  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadMore();
    }
  }, [inView, loadMore, loading, hasMore]);

  return (
    <AppShell>
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sticky top-0 z-10 bg-surface-base pt-2">
        {CATEGORIES.map(({ label, icon: Icon }) => (
          <button
            key={label}
            id={`category-chip-${label.toLowerCase().replace(' ', '-')}`}
            onClick={() => setActiveCategory(label)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              activeCategory === label
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-surface-elevated text-content-secondary hover:bg-surface-card hover:text-content-primary'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold font-display text-content-primary flex items-center gap-2">
          {activeCategory === 'For You' && <Sparkles className="w-5 h-5 text-brand-primary" />}
          {activeCategory === 'Trending' && <Flame className="w-5 h-5 text-orange-500" />}
          {activeCategory}
        </h1>
        <Badge variant="green" dot>Live Feed</Badge>
      </div>

      {/* Video grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        id="video-grid"
      >
        {videos.map(video => (
          <VideoCard
            key={video.id}
            id={typeof video.id === 'string' ? video.id : String(video.id)}
            title={video.title}
            thumbnailUrl={video.thumbnailUrl ? `${MINIO_BASE}/${video.thumbnailUrl}` : null}
            duration="—"
            channelName={video.uploader.displayName}
            channelAvatarUrl={video.uploader.avatarUrl}
            channelId={video.uploader.id}
            viewCount={video.viewCount ?? 0}
            publishedAt={video.createdAt}
            href={`/watch/${typeof video.id === 'string' ? video.id : String(video.id)}`}
          />
        ))}

        {loading && (
          <>
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
          </>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      {!loading && hasMore && (
        <div ref={ref} className="h-10 w-full mt-4" />
      )}

      {!hasMore && videos.length > 0 && (
        <p className="text-center text-content-secondary text-sm mt-8 pb-8">
          You&apos;ve reached the end.
        </p>
      )}

      {!loading && !hasMore && videos.length === 0 && (
        <div className="text-center text-content-secondary mt-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg font-medium text-content-primary mb-2">No videos yet</p>
          <p className="text-sm">Be the first to upload something!</p>
        </div>
      )}
    </AppShell>
  );
}
