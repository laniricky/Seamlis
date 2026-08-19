"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchApi } from "@/lib/api";
import { ShortPlayer } from "@/components/video/ShortPlayer";
import { Avatar } from "@/components/ui/Avatar";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

const MINIO_BASE = "http://localhost:9000/seamlis-videos";

interface Short {
  id: string;
  title: string;
  description?: string;
  processedVideoKey?: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  uploader: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

function ShortFeedItem({ short, isActive }: { short: Short; isActive: boolean }) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(short.likeCount);
  const [dislikeCount, setDislikeCount] = useState(short.dislikeCount);
  const [interaction, setInteraction] = useState<"LIKE" | "DISLIKE" | "NONE">("NONE");

  useEffect(() => {
    if (user) {
      fetchApi<{ interaction: "LIKE" | "DISLIKE" | "NONE" }>(`/engagement/videos/${short.id}/interaction`)
        .then(res => setInteraction(res.interaction))
        .catch(() => {});
    }
  }, [user, short.id]);

  const handleInteract = async (type: "LIKE" | "DISLIKE") => {
    if (!user) return; // TODO: redirect to login
    try {
      if (interaction === type) {
        await fetchApi(`/engagement/videos/${short.id}/interact`, {
          method: "POST",
          body: JSON.stringify({ type: "NONE" }),
        });
        if (type === "LIKE") setLikeCount(Math.max(0, likeCount - 1));
        if (type === "DISLIKE") setDislikeCount(Math.max(0, dislikeCount - 1));
        setInteraction("NONE");
      } else {
        await fetchApi(`/engagement/videos/${short.id}/interact`, {
          method: "POST",
          body: JSON.stringify({ type }),
        });
        if (type === "LIKE") {
          setLikeCount(likeCount + 1);
          if (interaction === "DISLIKE") setDislikeCount(Math.max(0, dislikeCount - 1));
        } else {
          setDislikeCount(dislikeCount + 1);
          if (interaction === "LIKE") setLikeCount(Math.max(0, likeCount - 1));
        }
        setInteraction(type);
      }
    } catch (e: unknown) {
      console.error(e);
    }
  };

  return (
    <div className="relative w-full h-full max-w-[500px] mx-auto bg-black rounded-xl sm:rounded-2xl overflow-hidden snap-center flex-shrink-0 flex items-center justify-center">
      {/* 9:16 Aspect Ratio Container */}
      <div className="relative w-full h-full aspect-[9/16] bg-black">
        {short.processedVideoKey ? (
          <ShortPlayer
            videoUrl={`${MINIO_BASE}/${short.processedVideoKey}`}
            isActive={isActive}
          />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-white bg-surface-elevated">
             <Loader2 className="w-8 h-8 animate-spin" />
           </div>
        )}

        {/* Right Action Bar */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
          <button 
            className="flex flex-col items-center gap-1 group"
            onClick={(e) => { e.stopPropagation(); handleInteract("LIKE"); }}
          >
            <div className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center transition-colors">
              <ThumbsUp className={cn("w-6 h-6", interaction === "LIKE" ? "text-brand-primary fill-brand-primary" : "text-white")} />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">{likeCount}</span>
          </button>

          <button 
            className="flex flex-col items-center gap-1 group"
            onClick={(e) => { e.stopPropagation(); handleInteract("DISLIKE"); }}
          >
            <div className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center transition-colors">
              <ThumbsDown className={cn("w-6 h-6", interaction === "DISLIKE" ? "text-white fill-white" : "text-white")} />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">Dislike</span>
          </button>

          <button className="flex flex-col items-center gap-1 group" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center transition-colors">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">{short.commentCount}</span>
          </button>

          <button className="flex flex-col items-center gap-1 group" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center transition-colors">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
          </button>

          <button className="flex flex-col items-center gap-1 group" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center transition-colors">
              <MoreVertical className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 mb-3 pointer-events-auto">
            <Link href={`/@${short.uploader.username}`} onClick={(e) => e.stopPropagation()}>
              <Avatar src={short.uploader.avatarUrl} alt={short.uploader.displayName} size="md" className="border border-white/20" />
            </Link>
            <Link href={`/@${short.uploader.username}`} className="text-white font-bold hover:underline" onClick={(e) => e.stopPropagation()}>
              @{short.uploader.username}
            </Link>
            <button 
              className="px-3 py-1 bg-white text-black text-sm font-bold rounded-full ml-2 hover:bg-white/90 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Subscribe
            </button>
          </div>
          
          <h3 className="text-white font-medium text-sm sm:text-base line-clamp-2 drop-shadow-md">
            {short.title}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetchApi<Short[]>("/videos/shorts?limit=10")
      .then((data) => {
        setShorts(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-id");
            if (id) setActiveId(id);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6, // Fire when 60% of the short is visible
      }
    );

    const map = itemsRef.current;
    map.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [shorts]);

  return (
    <AppShell>
      <div 
        className="w-full h-[calc(100vh-56px)] overflow-y-scroll snap-y snap-mandatory bg-surface-base sm:bg-surface-elevated flex flex-col relative"
        ref={containerRef}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
          </div>
        ) : shorts.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-2xl font-bold text-content-primary mb-2">No Shorts found</h2>
            <p className="text-content-secondary">Upload a short to see it here.</p>
          </div>
        ) : (
          <div className="py-0 sm:py-4 space-y-0 sm:space-y-4">
            {shorts.map((short) => (
              <div
                key={short.id}
                data-id={short.id}
                ref={(node) => {
                  if (node) itemsRef.current.set(short.id, node);
                  else itemsRef.current.delete(short.id);
                }}
                className="w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-56px-2rem)] snap-center flex items-center justify-center"
              >
                <ShortFeedItem 
                  short={short} 
                  isActive={activeId === short.id} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
