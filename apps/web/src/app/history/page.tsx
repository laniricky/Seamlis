'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { fetchApi } from '@/lib/api';
import { History, Loader2, Clock, PlayCircle } from 'lucide-react';

const MINIO_BASE = 'http://localhost:9000/seamlis-videos';

interface ChannelPreview {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface VideoSnapshot {
  id: string;
  title: string;
  description?: string;
  status: string;
  processedVideoKey?: string;
  thumbnailUrl?: string;
  viewCount: number;
  uploader: ChannelPreview;
  createdAt: string;
}

interface WatchHistoryItem {
  id: string;
  video: VideoSnapshot;
  watchedAt: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function groupByDate(items: WatchHistoryItem[]): Record<string, WatchHistoryItem[]> {
  const groups: Record<string, WatchHistoryItem[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  items.forEach(item => {
    const d = new Date(item.watchedAt);
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    let key: string;
    if (isSameDay(d, today)) key = 'Today';
    else if (isSameDay(d, yesterday)) key = 'Yesterday';
    else key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('seamlis-token');
    if (!token) {
      setLoading(false);
      setError('not-logged-in');
      return;
    }

    fetchApi<WatchHistoryItem[]>('/me/history?limit=50')
      .then(setHistory)
      .catch(err => setError(err?.message ?? 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  if (error === 'not-logged-in') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center">
            <History className="w-8 h-8 text-content-tertiary" />
          </div>
          <h1 className="text-2xl font-bold text-content-primary">Watch history</h1>
          <p className="text-content-secondary max-w-sm">
            Sign in to see your watch history and pick up where you left off.
          </p>
          <Link
            href="/auth/login"
            className="px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-full hover:bg-brand-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  const grouped = groupByDate(history);
  const groupKeys = Object.keys(grouped);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-content-primary">Watch History</h1>
            <p className="text-sm text-content-secondary">
              {history.length} {history.length === 1 ? 'video' : 'videos'} watched
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center">
              <PlayCircle className="w-10 h-10 text-content-tertiary" />
            </div>
            <h2 className="text-xl font-semibold text-content-primary">No history yet</h2>
            <p className="text-content-secondary max-w-sm">
              Videos you watch will appear here so you can easily find them again.
            </p>
            <Link
              href="/"
              className="px-5 py-2 bg-brand-primary text-white font-semibold rounded-full hover:bg-brand-600 transition-colors text-sm mt-2"
            >
              Browse videos
            </Link>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="space-y-8">
            {groupKeys.map(group => (
              <section key={group}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {group}
                </h2>
                <div className="space-y-2">
                  {grouped[group].map(item => (
                    <Link
                      key={item.id}
                      href={`/watch/${item.video.id}`}
                      id={`history-item-${item.video.id}`}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-surface-card border border-transparent hover:border-border transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-40 shrink-0 aspect-video bg-surface-elevated rounded-lg overflow-hidden">
                        {item.video.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${MINIO_BASE}/${item.video.thumbnailUrl}`}
                            alt={item.video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlayCircle className="w-8 h-8 text-content-tertiary" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-content-primary group-hover:text-brand-primary transition-colors line-clamp-2 text-sm leading-snug">
                          {item.video.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Avatar
                            src={item.video.uploader.avatarUrl}
                            alt={item.video.uploader.displayName}
                            size="xs"
                          />
                          <span className="text-xs text-content-secondary">
                            {item.video.uploader.displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-content-tertiary">
                          <span>{item.video.viewCount.toLocaleString()} views</span>
                          <span>·</span>
                          <span>Watched {formatRelativeTime(item.watchedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
