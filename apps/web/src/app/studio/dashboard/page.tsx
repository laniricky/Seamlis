"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Eye, Users, ThumbsUp, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface ChannelStats {
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
}

export default function StudioDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<ChannelStats>("/studio/stats")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <h1 className="text-3xl font-display font-bold text-content-primary mb-2">
        Channel dashboard
      </h1>
      <p className="text-content-secondary mb-8">
        Welcome back, {user?.displayName}
      </p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-content-secondary">
            <Users className="w-5 h-5 text-brand-primary" />
            <span className="font-semibold text-sm uppercase tracking-wider">Subscribers</span>
          </div>
          <h2 className="text-4xl font-bold text-content-primary">
            {stats?.totalSubscribers.toLocaleString() ?? 0}
          </h2>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-content-secondary">
            <Eye className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-sm uppercase tracking-wider">Views</span>
          </div>
          <h2 className="text-4xl font-bold text-content-primary">
            {stats?.totalViews.toLocaleString() ?? 0}
          </h2>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-content-secondary">
            <ThumbsUp className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-sm uppercase tracking-wider">Likes</span>
          </div>
          <h2 className="text-4xl font-bold text-content-primary">
            {stats?.totalLikes.toLocaleString() ?? 0}
          </h2>
        </div>
      </div>
      
      {/* Could add latest video performance here */}
      <div className="mt-12 bg-surface-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-center min-h-[200px]">
        <p className="text-content-secondary text-center">
          More detailed analytics coming soon!
        </p>
      </div>
    </div>
  );
}
