'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { fetchApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';


interface Preferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  notifyNewVideo: boolean;
  notifyComments: boolean;
  notifyLikes: boolean;
  notifySubscriptions: boolean;
}

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchApi<Preferences>('/notifications/preferences')
      .then(setPrefs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    if (!prefs) return;
    
    // Optimistic UI update
    setPrefs(prev => prev ? { ...prev, [key]: value } : null);
    setSaving(true);
    
    try {
      await fetchApi('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value })
      });
    } catch (err) {
      console.error(err);
      // Revert if failed
      setPrefs(prev => prev ? { ...prev, [key]: !value } : null);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <p className="text-content-secondary">Please log in to manage notifications.</p>
        </div>
      </AppShell>
    );
  }

  if (loading || !prefs) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      </AppShell>
    );
  }

  const ToggleRow = ({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
      <div>
        <h4 className="font-semibold text-content-primary">{label}</h4>
        <p className="text-sm text-content-secondary">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
      </label>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-display font-bold text-content-primary mb-2">
          Notification Settings
        </h1>
        <p className="text-content-secondary mb-8">
          Manage how and when you receive notifications from Seamlis.
        </p>

        <div className="bg-surface-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-content-primary mb-4">Delivery Channels</h2>
          <ToggleRow 
            label="In-App Notifications" 
            description="Receive notifications inside the Seamlis application (Bell icon)."
            checked={prefs.inAppEnabled}
            onChange={(v) => updatePref('inAppEnabled', v)}
          />
          <ToggleRow 
            label="Push Notifications" 
            description="Receive push notifications on your devices."
            checked={prefs.pushEnabled}
            onChange={(v) => updatePref('pushEnabled', v)}
          />
          <ToggleRow 
            label="Email Notifications" 
            description="Receive daily digests and important alerts via email."
            checked={prefs.emailEnabled}
            onChange={(v) => updatePref('emailEnabled', v)}
          />
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-content-primary mb-4">Event Preferences</h2>
          <ToggleRow 
            label="New Videos" 
            description="When channels you subscribe to upload new videos."
            checked={prefs.notifyNewVideo}
            onChange={(v) => updatePref('notifyNewVideo', v)}
          />
          <ToggleRow 
            label="Comments & Replies" 
            description="When someone comments on your video or replies to your comment."
            checked={prefs.notifyComments}
            onChange={(v) => updatePref('notifyComments', v)}
          />
          <ToggleRow 
            label="Likes" 
            description="When someone likes your video."
            checked={prefs.notifyLikes}
            onChange={(v) => updatePref('notifyLikes', v)}
          />
          <ToggleRow 
            label="New Subscribers" 
            description="When someone subscribes to your channel."
            checked={prefs.notifySubscriptions}
            onChange={(v) => updatePref('notifySubscriptions', v)}
          />
        </div>

        {saving && (
          <div className="fixed bottom-4 right-4 bg-surface-card border border-border px-4 py-2 rounded-lg shadow-lg text-sm text-content-primary flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            Saving preferences...
          </div>
        )}
      </div>
    </AppShell>
  );
}
