'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { ThumbsUp, CornerDownRight, Send, Loader2, MessageSquare } from 'lucide-react';

interface CommentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  videoId: string;
  user: CommentUser;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsApiResponse {
  id: string;
  videoId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    email: string;
    isVerified: boolean;
    createdAt: string;
  };
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsSectionProps {
  videoId: string;
  commentCount: number;
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
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function CommentsSection({ videoId, commentCount }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('seamlis-token'));
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi<CommentsApiResponse[]>(`/videos/${videoId}/comments?limit=50`);
      const mapped: Comment[] = data.map(c => ({
        id: c.id,
        videoId: c.videoId,
        user: {
          id: c.user.id,
          username: c.user.username,
          displayName: c.user.displayName,
          avatarUrl: c.user.avatarUrl,
        },
        parentId: c.parentId,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
      setComments(mapped);
    } catch {
      // silently fail — we just show no comments
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? replyContent.trim() : newComment.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      const body: { content: string; parentId?: string } = { content };
      if (parentId) body.parentId = parentId;

      const created = await fetchApi<CommentsApiResponse>(`/videos/${videoId}/comments`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const mappedComment: Comment = {
        id: created.id,
        videoId: created.videoId,
        user: {
          id: created.user.id,
          username: created.user.username,
          displayName: created.user.displayName,
          avatarUrl: created.user.avatarUrl,
        },
        parentId: created.parentId,
        content: created.content,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      if (parentId) {
        setComments(prev => [mappedComment, ...prev]);
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setComments(prev => [mappedComment, ...prev]);
        setNewComment('');
      }
    } catch {
      // handle error silently for now
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => !!c.parentId);

  return (
    <div className="mt-6 space-y-5" id="comments-section">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-content-secondary" />
        <h2 className="text-lg font-semibold text-content-primary">
          {commentCount.toLocaleString()} {commentCount === 1 ? 'Comment' : 'Comments'}
        </h2>
      </div>

      {/* New comment input */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <Avatar src={null} alt="You" size="sm" />
          <div className="flex-1">
            <textarea
              id="new-comment-input"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              rows={1}
              onFocus={e => { e.currentTarget.rows = 3; }}
              onBlur={e => { if (!newComment) e.currentTarget.rows = 1; }}
              className="w-full resize-none bg-transparent border-b border-border focus:border-brand-primary outline-none text-sm text-content-primary placeholder-content-tertiary pb-1 transition-colors"
            />
            {newComment && (
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewComment('')}
                  className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  id="submit-comment-btn"
                  className="flex items-center gap-2 px-4 py-1.5 bg-brand-primary text-white text-sm font-semibold rounded-full disabled:opacity-50 hover:bg-brand-600 transition-colors"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Comment
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="text-sm text-content-secondary border-b border-border pb-4">
          <a href="/auth/login" className="text-brand-primary hover:underline">Sign in</a> to leave a comment.
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-content-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading comments…
        </div>
      ) : topLevel.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3 text-center">
          <MessageSquare className="w-10 h-10 text-content-tertiary" />
          <p className="text-content-secondary text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevel.map(comment => (
            <div key={comment.id} className="flex gap-3 group" id={`comment-${comment.id}`}>
              <Avatar src={comment.user.avatarUrl} alt={comment.user.displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <a
                    href={`/@${comment.user.username}`}
                    className="text-sm font-semibold text-content-primary hover:text-brand-primary transition-colors"
                  >
                    {comment.user.displayName}
                  </a>
                  <span className="text-xs text-content-tertiary">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-content-secondary whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1 text-xs text-content-tertiary hover:text-content-primary transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                      className="text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {/* Reply input */}
                {replyingTo?.id === comment.id && (
                  <form onSubmit={e => handleSubmit(e, comment.id)} className="flex items-start gap-2 mt-3">
                    <Avatar src={null} alt="You" size="sm" />
                    <div className="flex-1">
                      <textarea
                        autoFocus
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${comment.user.displayName}…`}
                        rows={2}
                        className="w-full resize-none bg-transparent border-b border-brand-primary outline-none text-sm text-content-primary placeholder-content-tertiary pb-1"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                          className="px-3 py-1.5 text-xs text-content-secondary hover:text-content-primary rounded-full"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !replyContent.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-full disabled:opacity-50"
                        >
                          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Reply
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Nested replies */}
                {replies.filter(r => r.parentId === comment.id).map(reply => (
                  <div key={reply.id} className="flex gap-2 mt-3 pl-1 border-l-2 border-border" id={`comment-${reply.id}`}>
                    <CornerDownRight className="w-3.5 h-3.5 text-content-tertiary mt-1 shrink-0" />
                    <div className="flex gap-2 flex-1">
                      <Avatar src={reply.user.avatarUrl} alt={reply.user.displayName} size="xs" />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <a
                            href={`/@${reply.user.username}`}
                            className="text-xs font-semibold text-content-primary hover:text-brand-primary transition-colors"
                          >
                            {reply.user.displayName}
                          </a>
                          <span className="text-xs text-content-tertiary">{formatRelativeTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm text-content-secondary whitespace-pre-wrap leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
