'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Crown, DollarSign, Plus, TrendingUp, ArrowUpRight, Trash2 } from 'lucide-react';

interface EarningSummary {
  totalEarningsCents: number;
  tipCount: number;
  membershipCount: number;
}

interface Transaction {
  id: string;
  transactionType: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface MembershipTier {
  id: string;
  name: string;
  priceCents: number;
  perks: string[];
}

export default function MonetizationPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EarningSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [showCreateTier, setShowCreateTier] = useState(false);
  const [tierName, setTierName] = useState('');
  const [tierDescription, setTierDescription] = useState('');
  const [tierPrice, setTierPrice] = useState('');
  const [tierPerks, setTierPerks] = useState(['']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch earnings
    fetchApi('/studio/earnings')
      .then((res: unknown) => {
        const data = res as { summary: EarningSummary; transactions: Transaction[] };
        setSummary(data.summary);
        setTransactions(data.transactions || []);
      })
      .catch(console.error);

    // Fetch existing tiers
    fetchApi(`/channels/${user.id}/memberships`)
      .then((res: unknown) => setTiers(res as MembershipTier[]))
      .catch(console.error);
  }, [user]);

  const handleAddPerk = () => setTierPerks([...tierPerks, '']);
  const handlePerkChange = (i: number, val: string) => {
    const updated = [...tierPerks];
    updated[i] = val;
    setTierPerks(updated);
  };

  const handleCreateTier = async () => {
    if (!user || !tierName || !tierPrice) return;
    setSaving(true);
    try {
      const newTier = await fetchApi(`/channels/${user.id}/memberships`, {
        method: 'POST',
        body: JSON.stringify({
          name: tierName,
          description: tierDescription || null,
          priceCents: Math.round(parseFloat(tierPrice) * 100),
          perks: tierPerks.filter(Boolean),
        }),
      }) as MembershipTier;
      setTiers([...tiers, newTier]);
      setShowCreateTier(false);
      setTierName('');
      setTierDescription('');
      setTierPrice('');
      setTierPerks(['']);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const totalEarnings = summary ? (summary.totalEarningsCents / 100).toFixed(2) : '0.00';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <DollarSign className="w-8 h-8 text-green-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monetization</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Earnings', value: `$${totalEarnings}`, icon: TrendingUp, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
          { label: 'Super Thanks Received', value: summary?.tipCount ?? 0, icon: DollarSign, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Memberships', value: summary?.membershipCount ?? 0, icon: Crown, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Membership tiers */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Membership Tiers</h2>
          </div>
          <Button onClick={() => setShowCreateTier(!showCreateTier)} size="sm" variant="primary">
            <Plus className="w-4 h-4 mr-1" /> New Tier
          </Button>
        </div>

        {showCreateTier && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Create New Tier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Tier Name" value={tierName} onChange={e => setTierName(e.target.value)} placeholder="e.g. Gold Member" />
              <Input label="Monthly Price ($)" value={tierPrice} onChange={e => setTierPrice(e.target.value)} placeholder="e.g. 4.99" type="number" />
            </div>
            <Input label="Description (optional)" value={tierDescription} onChange={e => setTierDescription(e.target.value)} placeholder="What do members get?" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Perks</label>
              {tierPerks.map((perk, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-seamlis-green focus:border-transparent outline-none"
                    value={perk}
                    onChange={e => handlePerkChange(i, e.target.value)}
                    placeholder={`Perk ${i + 1}`}
                  />
                  {tierPerks.length > 1 && (
                    <button onClick={() => setTierPerks(tierPerks.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={handleAddPerk} className="text-sm text-seamlis-green hover:underline mt-1">+ Add perk</button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreateTier} disabled={saving || !tierName || !tierPrice} variant="primary">
                {saving ? 'Creating…' : 'Create Tier'}
              </Button>
              <Button onClick={() => setShowCreateTier(false)} variant="secondary">Cancel</Button>
            </div>
          </div>
        )}

        {tiers.length === 0 && !showCreateTier ? (
          <div className="p-12 text-center text-gray-500">
            <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No membership tiers yet. Create one to start earning from your biggest fans.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tiers.map((tier) => (
              <div key={tier.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{tier.name}</p>
                  <p className="text-sm text-gray-500">${(tier.priceCents / 100).toFixed(2)}/mo · {tier.perks.length} perks</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-green-500" />
            Recent Transactions
          </h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No transactions yet. Share your channel to start earning!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {['Type', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.transactionType === 'TIP'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    }`}>
                      {tx.transactionType === 'TIP' ? '💛 Super Thanks' : '👑 Membership'}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-green-600 dark:text-green-400">
                    +${(tx.amountCents / 100).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">{tx.status}</span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
