'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar } from '@/components/ui/Avatar';

import { fetchApi } from '@/lib/api';
import { Loader2, Search as SearchIcon, SlidersHorizontal, Filter, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface SearchResults {
  videos: VideoSnapshot[];
  channels: ChannelPreview[];
  totalVideos: number;
  totalChannels: number;
  query: string;
  sort: string;
  type: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialSort = searchParams.get('sort') || 'relevance';

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [type, setType] = useState(initialType);
  const [sort, setSort] = useState(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!rawQuery) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    fetchApi<SearchResults>(`/search?q=${encodeURIComponent(rawQuery)}&type=${type}&sort=${sort}`)
      .then(setResults)
      .catch((e: unknown) => {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to fetch results');
        }
      })
      .finally(() => setLoading(false));
  }, [rawQuery, type, sort]);

  if (!rawQuery) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <SearchIcon className="w-12 h-12 text-content-tertiary" />
          <p className="text-xl font-bold text-content-primary">Try searching for something</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto py-6 px-4">
        {/* Header & Filter Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Search results</h1>
            <p className="text-content-secondary mt-1">
              Showing results for &quot;<span className="font-semibold text-content-primary">{rawQuery}</span>&quot;
            </p>
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors w-full sm:w-auto",
              filtersOpen 
                ? "bg-brand-primary text-white" 
                : "bg-surface-elevated text-content-primary hover:bg-surface-card border border-border"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="bg-surface-card border border-border rounded-xl p-4 mb-8 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-3 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Type
                </h3>
                <div className="flex flex-col gap-2">
                  {['all', 'video', 'channel'].map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm text-content-primary cursor-pointer group">
                      <input 
                        type="radio" 
                        name="type" 
                        checked={type === t} 
                        onChange={() => setType(t)}
                        className="accent-brand-primary w-4 h-4" 
                      />
                      <span className="capitalize group-hover:text-brand-primary transition-colors">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-3 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Sort by
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    { val: 'relevance', label: 'Relevance' },
                    { val: 'newest', label: 'Upload date' },
                    { val: 'views', label: 'View count' }
                  ].map(s => (
                    <label key={s.val} className="flex items-center gap-2 text-sm text-content-primary cursor-pointer group">
                      <input 
                        type="radio" 
                        name="sort" 
                        checked={sort === s.val} 
                        onChange={() => setSort(s.val)}
                        className="accent-brand-primary w-4 h-4" 
                      />
                      <span className="group-hover:text-brand-primary transition-colors">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            <p className="text-content-secondary font-medium animate-pulse">Searching...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
            {error}
          </div>
        ) : !results || (results.videos.length === 0 && results.channels.length === 0) ? (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center">
              <SearchIcon className="w-10 h-10 text-content-tertiary" />
            </div>
            <h2 className="text-xl font-semibold text-content-primary">No results found</h2>
            <p className="text-content-secondary max-w-sm">
              Try different keywords or remove search filters
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Channels */}
            {results.channels.length > 0 && (
              <div className="space-y-4">
                {results.channels.map(channel => (
                  <Link 
                    key={channel.id} 
                    href={`/@${channel.username}`}
                    className="flex items-center gap-6 p-4 rounded-xl hover:bg-surface-card border border-transparent hover:border-border transition-all group"
                  >
                    <Avatar src={channel.avatarUrl} alt={channel.displayName} size="3xl" className="group-hover:scale-105 transition-transform" />
                    <div>
                      <h3 className="text-lg font-bold text-content-primary group-hover:text-brand-primary transition-colors">
                        {channel.displayName}
                      </h3>
                      <p className="text-sm text-content-secondary">@{channel.username}</p>
                    </div>
                  </Link>
                ))}
                {results.videos.length > 0 && <hr className="border-border my-6" />}
              </div>
            )}

            {/* Videos */}
            <div className="space-y-4">
              {results.videos.map(video => (
                <Link
                  key={video.id}
                  href={`/watch/${video.id}`}
                  className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-xl hover:bg-surface-card border border-transparent hover:border-border transition-all group"
                >
                  <div className="relative w-full sm:w-[360px] shrink-0 aspect-video bg-surface-elevated rounded-xl overflow-hidden">
                    {video.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${MINIO_BASE}/${video.thumbnailUrl}`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-content-tertiary" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="text-lg font-medium text-content-primary line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-content-secondary">
                      <span>{video.viewCount.toLocaleString()} views</span>
                      <span>·</span>
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <Avatar src={video.uploader.avatarUrl} alt={video.uploader.displayName} size="sm" />
                      <span className="text-sm font-medium text-content-secondary group-hover:text-content-primary transition-colors">
                        {video.uploader.displayName}
                      </span>
                    </div>
                    
                    {video.description && (
                      <p className="mt-4 text-sm text-content-secondary line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </AppShell>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
