'use client';

import { Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { fetchApi } from '@/lib/api';
import { useState } from 'react';

interface MembershipTier {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  perks: string[];
}

const TIER_COLORS = [
  'from-slate-400 to-slate-600',
  'from-yellow-400 to-amber-600',
  'from-violet-400 to-purple-600',
];

export function MembershipCard({
  tier,
  index,
  isOwned = false,
}: {
  tier: MembershipTier;
  index: number;
  isOwned?: boolean;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(isOwned);

  const gradient = TIER_COLORS[index % TIER_COLORS.length];

  const handleJoin = async () => {
    if (!user || joined) return;
    setLoading(true);
    try {
      // Create a membership payment intent
      await fetchApi('/payments/intent', {
        method: 'POST',
        body: JSON.stringify({
          payeeId: tier.id, // channel owner — in a full impl we'd pass channelId
          amountCents: tier.priceCents,
        }),
      });
      setJoined(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md hover:shadow-xl transition-all duration-300 group">
      {/* Header gradient banner */}
      <div className={`bg-gradient-to-r ${gradient} p-6 pb-10`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{tier.name}</h3>
            <p className="text-white/80 text-sm">${(tier.priceCents / 100).toFixed(2)}/month</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 -mt-4">
        {tier.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{tier.description}</p>
        )}

        <ul className="space-y-2 mb-6">
          {tier.perks.map((perk, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              {perk}
            </li>
          ))}
        </ul>

        {joined ? (
          <div className="w-full text-center py-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Joined
          </div>
        ) : (
          <Button
            onClick={handleJoin}
            disabled={!user || loading}
            className={`w-full bg-gradient-to-r ${gradient} text-white font-semibold hover:opacity-90 transition-opacity`}
          >
            {loading ? 'Processing…' : `Join for $${(tier.priceCents / 100).toFixed(2)}/mo`}
          </Button>
        )}
      </div>
    </div>
  );
}
