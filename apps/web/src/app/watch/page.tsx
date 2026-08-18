"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VideoCard } from "@/components/ui/VideoCard";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  MoreHorizontal,
  Bell,
} from "lucide-react";

// --- Mock data until the API is fully wired ---
const MOCK_VIDEO = {
  id: "v1",
  title: "Building a Full-Stack App with Next.js 14 & Ktor",
  description:
    "In this in-depth tutorial we build a complete full-stack video platform called Seamlis using Next.js 14, Ktor for the backend API, PostgreSQL for data, and MinIO for object storage. We cover authentication with JWT, video uploads with pre-signed S3 URLs, and a beautiful reactive UI.",
  videoUrl: null, // Will be a real presigned URL once backend is live
  uploader: {
    displayName: "Seamlis Tutorials",
    username: "seamlis",
    avatarUrl: null,
    subscribers: "12.4K",
    isSubscribed: false,
  },
  views: "48,234",
  likes: "2,130",
  timestamp: "3 days ago",
};

const RELATED = [
  {
    id: "v2",
    title: "Next.js 14 App Router — A Complete Guide",
    thumbnailUrl: null,
    uploader: { displayName: "Dev Masters", avatarUrl: null },
    views: "312K",
    duration: "28:14",
    timestamp: "1 week ago",
  },
  {
    id: "v3",
    title: "Ktor Tutorial — Building REST APIs in Kotlin",
    thumbnailUrl: null,
    uploader: { displayName: "Kotlin Pros", avatarUrl: null },
    views: "88K",
    duration: "45:02",
    timestamp: "2 weeks ago",
  },
  {
    id: "v4",
    title: "JWT Authentication Explained — Access & Refresh Tokens",
    thumbnailUrl: null,
    uploader: { displayName: "Security Simplified", avatarUrl: null },
    views: "196K",
    duration: "15:33",
    timestamp: "1 month ago",
  },
];

export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "v1";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Video Player */}
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center mb-4 border border-border">
              {MOCK_VIDEO.videoUrl ? (
                <video
                  ref={videoRef}
                  src={MOCK_VIDEO.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center">
                    <span className="text-brand-primary text-4xl font-bold font-display">▶</span>
                  </div>
                  <p className="text-content-secondary text-sm">
                    Video preview — connect Docker + backend to stream
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold font-display text-content-primary leading-snug mb-3">
              {MOCK_VIDEO.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              {/* Uploader */}
              <div className="flex items-center gap-3">
                <Link href={`/@${MOCK_VIDEO.uploader.username}`}>
                  <Avatar
                    src={MOCK_VIDEO.uploader.avatarUrl}
                    alt={MOCK_VIDEO.uploader.displayName}
                    size="md"
                  />
                </Link>
                <div>
                  <Link
                    href={`/@${MOCK_VIDEO.uploader.username}`}
                    className="font-semibold text-content-primary hover:text-brand-primary transition-colors"
                  >
                    {MOCK_VIDEO.uploader.displayName}
                  </Link>
                  <p className="text-xs text-content-secondary">
                    {MOCK_VIDEO.uploader.subscribers} subscribers
                  </p>
                </div>
                <button
                  onClick={() => setSubscribed((s) => !s)}
                  className={`ml-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    subscribed
                      ? "bg-surface-elevated text-content-primary border border-border"
                      : "bg-content-primary text-surface-base"
                  }`}
                  id="subscribe-btn"
                >
                  {subscribed ? (
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4" />
                      Subscribed
                    </span>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-surface-card border border-border rounded-full overflow-hidden">
                  <button
                    onClick={() => setLiked((l) => !l)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      liked ? "text-brand-primary" : "text-content-secondary hover:text-content-primary"
                    }`}
                    id="like-btn"
                  >
                    <ThumbsUp className={`w-4 h-4 ${liked ? "fill-brand-primary" : ""}`} />
                    {liked ? parseInt(MOCK_VIDEO.likes.replace(/,/g, "")) + 1 : MOCK_VIDEO.likes}
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
                  className="flex items-center gap-2 px-4 py-2 bg-surface-card hover:bg-surface-elevated border border-border rounded-full text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
                  id="share-btn"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                    savedMsg
                      ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                      : "bg-surface-card hover:bg-surface-elevated border-border text-content-secondary hover:text-content-primary"
                  }`}
                  id="save-btn"
                >
                  <Bookmark className={`w-4 h-4 ${savedMsg ? "fill-brand-primary" : ""}`} />
                  {savedMsg ? "Saved!" : "Save"}
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
            <div className="bg-surface-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3 text-sm text-content-secondary mb-3">
                <span className="font-semibold text-content-primary">{MOCK_VIDEO.views} views</span>
                <span>{MOCK_VIDEO.timestamp}</span>
                <Badge variant="default" size="sm">HD</Badge>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">
                {MOCK_VIDEO.description}
              </p>
            </div>
          </div>

          {/* Related videos sidebar */}
          <aside className="w-full lg:w-[360px] shrink-0 space-y-3">
            <h2 className="text-base font-semibold font-display text-content-primary mb-3">
              Related videos
            </h2>
            {RELATED.map((v) => (
              <VideoCard
                key={v.id}
                id={v.id}
                title={v.title}
                thumbnailUrl={v.thumbnailUrl}
                uploaderDisplayName={v.uploader.displayName}
                uploaderAvatarUrl={v.uploader.avatarUrl}
                views={v.views}
                duration={v.duration}
                timestamp={v.timestamp}
                variant="compact"
              />
            ))}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
