"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function StudioCustomization() {
  const { user, refreshUser } = useAuth();
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await fetchApi("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName, bio }),
      });
      setSuccessMsg("Channel updated successfully.");
      await refreshUser(); // Fetch updated user details
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to update channel");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <h1 className="text-3xl font-display font-bold text-content-primary mb-8">
        Channel customization
      </h1>

      <div className="bg-surface-card border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">
              Channel Name
            </label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              required
            />
            <p className="mt-2 text-xs text-content-secondary">
              This is the name that will be displayed on your videos and channel page.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">
              Description (Bio)
            </label>
            <textarea
              className="w-full bg-surface-base border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none h-32"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell viewers about your channel"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
