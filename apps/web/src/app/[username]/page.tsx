'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CommunityPost, CommunityPostData } from '@/components/community/CommunityPost';
import { MembershipCard } from '@/components/monetization/MembershipCard';

interface ChannelProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  isSubscribed: boolean;
}

interface MembershipTier {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  perks: string[];
}

const TABS = ['Videos', 'Shorts', 'Community', 'Playlists', 'Memberships', 'About'] as const;
type Tab = typeof TABS[number];

export default function ChannelPage() {
  const params = useParams();
  const username = (params.username as string)?.replace('%40', '').replace('@', '');
  const { user } = useAuth();

  const [channel, setChannel] = useState<ChannelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Videos');
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);

  useEffect(() => {
    if (!username) return;
    fetchApi<ChannelProfile>(`/channels/${username}`)
      .then(data => {
        setChannel(data);
        setSubscribed(data.isSubscribed);
        setSubCount(data.subscriberCount);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  const handleSubscribe = async () => {
    if (!user || !channel) return;
    const wasSubscribed = subscribed;
    setSubscribed(!wasSubscribed);
    setSubCount(c => wasSubscribed ? c - 1 : c + 1);
    try {
      await fetchApi(`/engagement/channels/${channel.id}/subscribe`, { method: 'POST' });
    } catch {
      setSubscribed(wasSubscribed);
      setSubCount(c => wasSubscribed ? c + 1 : c - 1);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      </AppShell>
    );
  }

  if (!channel) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Users className="w-16 h-16 text-content-secondary opacity-20" />
          <p className="text-content-secondary">Channel not found</p>
        </div>
      </AppShell>
    );
  }

  const formatCount = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <AppShell>
      {/* Banner */}
      <div className="w-full h-40 sm:h-56 bg-gradient-to-br from-brand-primary/40 to-surface-elevated rounded-none sm:rounded-xl overflow-hidden mb-0">
        {channel.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.bannerUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Channel info */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 mb-6">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-surface-base overflow-hidden shrink-0 bg-surface-elevated">
            <Avatar src={channel.avatarUrl} alt={channel.displayName} size="xl" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-display font-bold text-content-primary">{channel.displayName}</h1>
            <p className="text-content-secondary text-sm">@{channel.username} · {formatCount(subCount)} subscribers · {channel.videoCount} videos</p>
            {channel.bio && (
              <p className="text-content-secondary text-sm mt-1 line-clamp-2">{channel.bio}</p>
            )}
          </div>
          <div className="flex gap-2 pb-1">
            {user && user.username !== channel.username && (
              <button
                onClick={handleSubscribe}
                className={cn(
                  'px-5 py-2 rounded-full font-semibold text-sm transition-all',
                  subscribed
                    ? 'bg-surface-elevated text-content-primary border border-border hover:border-red-500 hover:text-red-500'
                    : 'bg-content-primary text-surface-base hover:opacity-90'
                )}
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex border-b border-border mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-content-primary text-content-primary'
                  : 'border-transparent text-content-secondary hover:text-content-primary hover:border-border'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        {activeTab === 'Community' ? (
          <div className="max-w-2xl mx-auto pb-12">
            <CommunityTabContent channelId={channel.id} />
          </div>
        ) : activeTab === 'About' ? (
          <div className="max-w-2xl pb-12">
            <div className="bg-surface-card border border-border rounded-xl p-6">
              <h2 className="font-bold text-content-primary text-lg mb-3">Description</h2>
              <p className="text-content-secondary whitespace-pre-line">{channel.bio || 'No description provided.'}</p>
            </div>
          </div>
        ) : activeTab === 'Memberships' ? (
          <div className="pb-12">
            <MembershipsTabContent channelId={channel.id} />
          </div>
        ) : (
          <div className="pb-12">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-content-secondary">
                  {activeTab === 'Videos' && 'Videos will appear here'}
                  {activeTab === 'Shorts' && 'Shorts will appear here'}
                  {activeTab === 'Playlists' && 'Playlists will appear here'}
                </p>
                <Link href="/" className="text-brand-primary text-sm mt-2 block hover:underline">Explore other content</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function CommunityTabContent({ channelId }: { channelId: string }) {
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<CommunityPostData[]>(
      `/channels/${channelId}/community`
    )
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-content-secondary">
        <p className="text-lg font-medium mb-2">No community posts yet</p>
        <p className="text-sm">This channel hasn&apos;t posted anything here yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <CommunityPost
          key={post.id}
          post={post}
          onVote={(updated: CommunityPostData) =>
            setPosts(posts.map(p => p.id === updated.id ? updated : p))
          }
        />
      ))}
    </div>
  );
}

function MembershipsTabContent({ channelId }: { channelId: string }) {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`/channels/${channelId}/memberships`)
      .then((res: unknown) => setTiers(res as MembershipTier[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-content-secondary">
        <p>This channel does not offer any memberships yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {tiers.map((tier, idx) => (
        <MembershipCard key={tier.id} tier={tier} index={idx} />
      ))}
    </div>
  );
}
