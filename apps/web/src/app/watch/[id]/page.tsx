'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import VideoPlayer from '@/components/VideoPlayer';
import CommentsSection from '@/components/CommentsSection';
import { TipButton } from '@/components/monetization/TipButton';
import { fetchApi } from '@/lib/api';
import {
  ThumbsUp, ThumbsDown, Share2, Bookmark, MoreHorizontal,
  Bell, Loader2, CheckCircle2,
} from 'lucide-react';

const MINIO_BASE = 'http://localhost:9000/seamlis-videos';

interface ChannelPreview {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  status: string;
  processedVideoKey?: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  uploader: ChannelPreview;
  createdAt: string;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [liking, setLiking] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('seamlis-token'));
  }, []);

  const loadVideo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const videoData = await fetchApi<Video>(`/videos/${id}`);
      setVideo(videoData);
      setLikeCount(videoData.likeCount);
      
      try {
        const relatedVideos = await fetchApi<Video[]>(`/recommendations/related?videoId=${id}&uploaderId=${videoData.uploader.id}`);
        setRelated(relatedVideos);
      } catch (relatedErr) {
        console.error("Failed to load related videos", relatedErr);
        setRelated([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadVideo(); }, [loadVideo]);

  const handleLike = async () => {
    if (!isLoggedIn || liking) return;
    const newLiked = !liked;
    // Optimistic UI
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    setLiking(true);
    try {
      await fetchApi(`/videos/${id}/like`, {
        method: 'POST',
        body: JSON.stringify({ isLike: true }),
      });
    } catch {
      // Revert on failure
      setLiked(!newLiked);
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
    } finally {
      setLiking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn || subscribing || !video) return;
    setSubscribing(true);
    const prev = subscribed;
    setSubscribed(s => !s);
    try {
      await fetchApi(`/users/${video.uploader.id}/subscribe`, { method: 'POST' });
    } catch {
      setSubscribed(prev);
    } finally {
      setSubscribing(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // fallback
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const hlsUrl = video?.processedVideoKey
    ? `${MINIO_BASE}/${video.processedVideoKey}`
    : null;

  const posterUrl = video?.thumbnailUrl
    ? `${MINIO_BASE}/${video.thumbnailUrl}`
    : undefined;

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (error || !video) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-2xl font-bold text-content-primary">Video not found</p>
          <p className="text-content-secondary">{error}</p>
          <Link href="/" className="text-brand-500 hover:underline">← Back to home</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Share toast */}
      {showShareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface-card border border-border shadow-xl rounded-full px-4 py-2 text-sm font-medium text-content-primary animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-brand-primary" />
          Link copied!
        </div>
      )}

      <div className="max-w-[1400px] mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ─── Main content ─── */}
          <div className="flex-1 min-w-0">
            {/* Video Player */}
            {hlsUrl ? (
              <VideoPlayer
                src={hlsUrl}
                poster={posterUrl}
                title={video.title}
                videoId={video.id}
                className="mb-4"
              />
            ) : (
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center mb-4 border border-border gap-3">
                <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center">
                  {video.status === 'PROCESSING' ? (
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                  ) : (
                    <span className="text-brand-primary text-3xl">▶</span>
                  )}
                </div>
                <p className="text-content-secondary text-sm">
                  {video.status === 'PROCESSING'
                    ? 'Video is being processed… check back soon'
                    : 'Video not yet available'}
                </p>
                <Badge variant="gray">{video.status}</Badge>
              </div>
            )}

            {/* Title */}
            <h1 className="text-xl font-bold font-display text-content-primary leading-snug mb-3">
              {video.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              {/* Uploader + Subscribe */}
              <div className="flex items-center gap-3">
                <Link href={`/@${video.uploader.username}`}>
                  <Avatar src={video.uploader.avatarUrl} alt={video.uploader.displayName} size="md" />
                </Link>
                <div>
                  <Link
                    href={`/@${video.uploader.username}`}
                    className="font-semibold text-content-primary hover:text-brand-primary transition-colors"
                  >
                    {video.uploader.displayName}
                  </Link>
                  <p className="text-xs text-content-secondary">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className={`ml-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    subscribed
                      ? 'bg-surface-elevated text-content-primary border border-border'
                      : 'bg-content-primary text-surface-base'
                  } ${subscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  id="subscribe-btn"
                >
                  {subscribing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : subscribed ? (
                    <Bell className="w-4 h-4" />
                  ) : null}
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <TipButton payeeId={video.uploader.id} creatorName={video.uploader.displayName} />
                {/* Like / Dislike pill */}
                <div className="flex items-center bg-surface-card border border-border rounded-full overflow-hidden">
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      liked ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'
                    } ${liking ? 'opacity-70' : ''}`}
                    id="like-btn"
                  >
                    <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-brand-primary' : ''}`} />
                    {likeCount > 0 ? likeCount.toLocaleString() : ''}
                  </button>
                  <div className="w-px h-5 bg-border" />
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
                    id="dislike-btn"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-card hover:bg-surface-elevated border border-border rounded-full text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
                  id="share-btn"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>

                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                    savedMsg
                      ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                      : 'bg-surface-card hover:bg-surface-elevated border-border text-content-secondary hover:text-content-primary'
                  }`}
                  id="save-btn"
                >
                  <Bookmark className={`w-4 h-4 ${savedMsg ? 'fill-brand-primary' : ''}`} />
                  {savedMsg ? 'Saved!' : 'Save'}
                </button>

                <button
                  className="p-2 bg-surface-card hover:bg-surface-elevated border border-border rounded-full text-content-secondary hover:text-content-primary transition-colors"
                  id="more-btn"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description Box */}
            <div className="bg-surface-card rounded-xl p-4 border border-border mb-4">
              <div className="flex items-center gap-3 text-sm text-content-secondary mb-3">
                <span className="font-semibold text-content-primary">
                  {new Date(video.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-content-secondary">
                  {video.viewCount.toLocaleString()} {video.viewCount === 1 ? 'view' : 'views'}
                </span>
                <Badge variant="gray">{video.status}</Badge>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">
                {video.description || 'No description provided.'}
              </p>
            </div>

            {/* Comments */}
            <CommentsSection videoId={video.id} commentCount={video.commentCount} />
          </div>

          {/* ─── Related videos sidebar ─── */}
          <aside className="w-full lg:w-[360px] shrink-0 space-y-3">
            <h2 className="text-base font-semibold font-display text-content-primary mb-3">
              More videos
            </h2>
            {related.length === 0 ? (
              <p className="text-content-secondary text-sm">No other videos yet.</p>
            ) : (
              related.map(v => (
                <Link
                  href={`/watch/${v.id}`}
                  key={v.id}
                  className="flex gap-3 group rounded-xl p-2 hover:bg-surface-card transition-colors"
                >
                  <div className="relative w-[168px] shrink-0 aspect-video bg-surface-elevated rounded-lg overflow-hidden">
                    {v.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${MINIO_BASE}/${v.thumbnailUrl}`}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-content-tertiary text-xl">▶</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary line-clamp-2 group-hover:text-brand-primary transition-colors">
                      {v.title}
                    </p>
                    <p className="text-xs text-content-secondary mt-1 hover:text-content-primary transition-colors">
                      {v.uploader.displayName}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {v.viewCount.toLocaleString()} views
                    </p>
                  </div>
                </Link>
              ))
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
