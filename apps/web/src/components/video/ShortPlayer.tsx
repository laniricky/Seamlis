"use client";

import { useEffect, useRef, useState } from "react";
import { Play, VolumeX, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortPlayerProps {
  videoUrl: string;
  isActive: boolean;
  className?: string;
}

export function ShortPlayer({ videoUrl, isActive, className }: ShortPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Play/pause based on intersection observer state (isActive)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.play().catch((err) => {
        console.log("Autoplay prevented", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div
      className={cn("relative w-full h-full bg-black group cursor-pointer overflow-hidden", className)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
      />

      {/* Play/Pause Overlay Icon */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
          <div className="w-16 h-16 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Mute Overlay Button */}
      <button
        onClick={toggleMute}
        className={cn(
          "absolute top-4 right-4 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white transition-all",
          "opacity-0 group-hover:opacity-100 sm:opacity-100" // Always show on mobile? Or just show when hovering?
        )}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Scrubber / Progress Bar (Minimal for shorts) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
         <div 
           className="h-full bg-brand-primary"
           style={{ width: '0%' }} // You could implement a timeupdate listener to animate this
         />
      </div>
    </div>
  );
}
