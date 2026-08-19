'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ThumbsUp, MessageSquare, Share2, Pin, BarChart3, ImageIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  votedByMe: boolean;
}

export interface CommunityPostData {
  id: string;
  channelId: string;
  channelName: string;
  channelUsername: string;
  channelAvatarUrl: string | null;
  type: string;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  pollOptions: PollOption[] | null;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

const TYPE_STYLES: Record<string, string> = {
  ANNOUNCEMENT: 'border-l-4 border-brand-primary bg-brand-primary/5',
  QUESTION: 'border-l-4 border-blue-500 bg-blue-500/5',
  POLL: '',
  IMAGE: '',
  TEXT: '',
};

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ANNOUNCEMENT: { label: 'Announcement', icon: '📣', color: 'text-brand-primary' },
  QUESTION: { label: 'Question', icon: '❓', color: 'text-blue-500' },
  POLL: { label: 'Poll', icon: <BarChart3 className="w-3.5 h-3.5" />, color: 'text-purple-500' },
  IMAGE: { label: 'Photo', icon: <ImageIcon className="w-3.5 h-3.5" />, color: 'text-orange-500' },
  TEXT: { label: '', icon: '', color: '' },
};

interface CommunityPostProps {
  post: CommunityPostData;
  onVote?: (updatedPost: CommunityPostData) => void;
}

export function CommunityPost({ post: initialPost, onVote }: CommunityPostProps) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [voting, setVoting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const hasVoted = post.pollOptions?.some(o => o.votedByMe) ?? false;

  const handleLike = async () => {
    if (!user) return;
    const prev = post.likedByMe;
    // Optimistic update
    setPost(p => ({
      ...p,
      likedByMe: !p.likedByMe,
      likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
    }));
    try {
      await fetchApi(`/channels/${post.channelId}/community/${post.id}/like`, { method: 'POST' });
    } catch {
      // Revert
      setPost(p => ({ ...p, likedByMe: prev, likeCount: prev ? p.likeCount + 1 : p.likeCount - 1 }));
    }
  };

  const handleVote = async (optionId: string) => {
    if (!user || hasVoted || voting) return;
    setVoting(true);
    try {
      const updated = await fetchApi<CommunityPostData>(
        `/channels/${post.channelId}/community/${post.id}/vote`,
        { method: 'POST', body: JSON.stringify({ optionId }) }
      );
      setPost(updated);
      onVote?.(updated);
    } catch {
      // Handle error silently
    } finally {
      setVoting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/@${post.channelUsername}/community/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setSharing(true);
      setTimeout(() => setSharing(false), 2000);
    } catch {
      // fallback
    }
  };

  const typeInfo = TYPE_LABELS[post.type];

  return (
    <article className={cn(
      'bg-surface-card border border-border rounded-xl p-5 transition-shadow hover:shadow-md',
      TYPE_STYLES[post.type]
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Link href={`/@${post.channelUsername}`}>
          <Avatar src={post.channelAvatarUrl} alt={post.channelName} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/@${post.channelUsername}`} className="font-semibold text-content-primary hover:text-brand-primary transition-colors">
              {post.channelName}
            </Link>
            {post.isPinned && (
              <span className="flex items-center gap-1 text-xs text-content-secondary">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            {typeInfo?.label && (
              <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-surface-elevated', typeInfo.color)}>
                {typeInfo.icon} {typeInfo.label}
              </span>
            )}
          </div>
          <p className="text-xs text-content-secondary mt-0.5">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.title && (
          <h3 className="font-bold text-content-primary text-lg mb-2 leading-snug">{post.title}</h3>
        )}
        {post.body && (
          <p className="text-content-secondary leading-relaxed whitespace-pre-line">{post.body}</p>
        )}

        {/* Image */}
        {post.type === 'IMAGE' && post.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border">
            <Image
              src={post.imageUrl}
              alt={post.title || 'Community post image'}
              width={800}
              height={450}
              className="w-full object-cover max-h-[450px]"
            />
          </div>
        )}

        {/* Poll */}
        {post.type === 'POLL' && post.pollOptions && (
          <div className="mt-4 space-y-2">
            {post.pollOptions.map(option => (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || !user || voting}
                className={cn(
                  'relative w-full text-left rounded-lg overflow-hidden border transition-all',
                  hasVoted
                    ? option.votedByMe
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-border bg-surface-elevated'
                    : 'border-border bg-surface-elevated hover:border-brand-primary hover:bg-brand-primary/5 cursor-pointer'
                )}
              >
                {/* Vote bar */}
                {hasVoted && (
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 transition-all duration-700',
                      option.votedByMe ? 'bg-brand-primary/20' : 'bg-surface-base/50'
                    )}
                    style={{ width: `${option.percentage}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-3">
                  <span className={cn('text-sm font-medium', option.votedByMe ? 'text-brand-primary' : 'text-content-primary')}>
                    {option.votedByMe && <span className="mr-2">✓</span>}
                    {option.text}
                  </span>
                  {hasVoted && (
                    <span className="text-sm font-semibold text-content-secondary">
                      {option.percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </button>
            ))}
            <p className="text-xs text-content-secondary mt-2">
              {post.totalVotes} vote{post.totalVotes !== 1 ? 's' : ''}
              {!hasVoted && !user && ' · Sign in to vote'}
              {!hasVoted && user && ' · Select an option to vote'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors',
            post.likedByMe ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'
          )}
        >
          <ThumbsUp className={cn('w-4 h-4', post.likedByMe && 'fill-brand-primary')} />
          {post.likeCount > 0 && <span>{post.likeCount}</span>}
        </button>

        <button className="flex items-center gap-1.5 text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">
          <MessageSquare className="w-4 h-4" />
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
        </button>

        <button
          onClick={handleShare}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors ml-auto',
            sharing ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'
          )}
        >
          <Share2 className="w-4 h-4" />
          {sharing ? 'Copied!' : 'Share'}
        </button>
      </div>
    </article>
  );
}
