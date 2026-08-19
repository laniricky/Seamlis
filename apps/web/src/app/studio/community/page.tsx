'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Image as ImageIcon, BarChart3, HelpCircle, Megaphone, Plus, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type PostType = 'TEXT' | 'IMAGE' | 'POLL' | 'QUESTION' | 'ANNOUNCEMENT';

interface PostTypeConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const POST_TYPES: Record<PostType, PostTypeConfig> = {
  TEXT: { label: 'Text Post', description: 'Share thoughts with your community', icon: <FileText className="w-5 h-5" />, color: 'text-content-primary', bg: 'bg-surface-elevated' },
  IMAGE: { label: 'Photo', description: 'Share an image with your community', icon: <ImageIcon className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  POLL: { label: 'Poll', description: 'Ask your community to vote', icon: <BarChart3 className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  QUESTION: { label: 'Question', description: 'Ask your community something', icon: <HelpCircle className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ANNOUNCEMENT: { label: 'Announcement', description: 'Make an important announcement', icon: <Megaphone className="w-5 h-5" />, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
};

export default function StudioCommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<PostType>('TEXT');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <p className="text-content-secondary">Please sign in to access Creator Studio.</p>
        </div>
      </AppShell>
    );
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, '']);
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    
    if (selectedType === 'POLL') {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) {
        setError('Please add at least 2 poll options');
        return;
      }
    }

    if (!body && selectedType !== 'POLL') {
      setError('Post content cannot be empty');
      return;
    }

    setPosting(true);
    try {
      await fetchApi(`/channels/${user.id}/community`, {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          title: title || null,
          body: body || null,
          imageUrl: imageUrl || null,
          pollOptions: selectedType === 'POLL' ? pollOptions.filter(o => o.trim()) : null,
        }),
      });
      router.push(`/@${user.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const config = POST_TYPES[selectedType];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-display font-bold text-content-primary mb-2">
          Create Community Post
        </h1>
        <p className="text-content-secondary mb-8">
          Share updates, polls, and announcements with your community.
        </p>

        {/* Post Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {(Object.entries(POST_TYPES) as [PostType, PostTypeConfig][]).map(([type, cfg]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                selectedType === type
                  ? `border-current ${cfg.color} ${cfg.bg}`
                  : 'border-border text-content-secondary hover:border-border hover:bg-surface-elevated'
              )}
            >
              <span className={selectedType === type ? cfg.color : ''}>{cfg.icon}</span>
              <span className="text-xs text-center leading-tight">{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* Composer card */}
        <div className="bg-surface-card border border-border rounded-xl p-6 space-y-4 mb-6">
          <div className={cn('flex items-center gap-2 text-sm font-semibold', config.color)}>
            {config.icon}
            <span>{config.description}</span>
          </div>

          {/* Title (optional for TEXT, required for ANNOUNCEMENT) */}
          {(selectedType === 'ANNOUNCEMENT' || selectedType === 'QUESTION' || selectedType === 'IMAGE') && (
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                {selectedType === 'QUESTION' ? 'Question' : 'Title'}
                {selectedType !== 'IMAGE' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  selectedType === 'QUESTION' ? 'Ask your community something...'
                  : selectedType === 'ANNOUNCEMENT' ? 'Announcement headline...'
                  : 'Caption (optional)'
                }
                className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow"
              />
            </div>
          )}

          {/* Body text */}
          {selectedType !== 'POLL' && (
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                {selectedType === 'TEXT' || selectedType === 'ANNOUNCEMENT' ? 'Content' : 'Details'}
                {selectedType !== 'IMAGE' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
                placeholder="Write something for your community..."
                className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow resize-none"
              />
            </div>
          )}

          {/* Image URL input */}
          {selectedType === 'IMAGE' && (
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">Image URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow"
              />
              <p className="text-xs text-content-secondary mt-1">Direct image URL. Video upload for media will be added soon.</p>
            </div>
          )}

          {/* Poll options */}
          {selectedType === 'POLL' && (
            <div>
              <label className="block text-sm font-medium text-content-primary mb-3">
                Poll Question <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What do you want to ask?"
                className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow mb-4"
              />
              <label className="block text-sm font-medium text-content-primary mb-2">
                Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {pollOptions.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs text-content-secondary shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={e => updatePollOption(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(idx)}
                        className="p-2 text-content-secondary hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 6 && (
                <button
                  onClick={addPollOption}
                  className="mt-3 flex items-center gap-2 text-sm text-brand-primary hover:text-brand-secondary font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add option
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-border rounded-full text-content-secondary hover:text-content-primary text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={posting}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-semibold hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
