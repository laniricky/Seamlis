'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { cn } from '@/lib/utils';
import VideoControls from './VideoControls';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081/api/v1';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('seamlis_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('seamlis_session_id', id);
  }
  return id;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  videoId?: string;
  className?: string;
}


export default function VideoPlayer({ src, poster, title, videoId, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Analytics tracking refs
  const hasCountedView = useRef(false);
  const watchStartRef = useRef<number | null>(null);
  const totalWatchedRef = useRef(0);
  const analyticsTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [hls, setHls] = useState<Hls | null>(null);
  
  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Quality State
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is auto

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hlsInstance = new Hls({
        debug: false,
      });

      hlsInstance.loadSource(src);
      hlsInstance.attachMedia(video);
      
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(hlsInstance.levels);
      });

      hlsInstance.on(Hls.Events.LEVEL_SWITCHED, () => {
        setCurrentLevel(hlsInstance.currentLevel); // Might be -1 if auto
      });

      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hlsInstance.recoverMediaError();
              break;
            default:
              hlsInstance.destroy();
              break;
          }
        }
      });

      setHls(hlsInstance);

      return () => {
        hlsInstance.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }, [src]);

  // Analytics helper
  const sendAnalyticsEvent = useCallback((eventName: string, extra?: Record<string, unknown>) => {
    if (!videoId) return;
    const sessionId = getOrCreateSessionId();
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const payload = JSON.stringify({
      eventName,
      sessionId,
      properties: JSON.stringify({
        duration: videoRef.current?.duration ?? 0,
        currentTime: videoRef.current?.currentTime ?? 0,
        ...extra,
      }),
    });
    fetch(`${API_BASE}/videos/${videoId}/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: payload,
    }).catch(() => {}); // fire-and-forget
  }, [videoId]);

  const sendBeaconEvent = useCallback((eventName: string, watchedSeconds: number) => {
    if (!videoId || typeof window === 'undefined') return;
    const sessionId = getOrCreateSessionId();
    const token = localStorage.getItem('access_token');
    const payload = JSON.stringify({
      eventName,
      sessionId,
      properties: JSON.stringify({
        watchedSeconds,
        completionRate: videoRef.current?.duration
          ? Math.round((watchedSeconds / videoRef.current.duration) * 100)
          : 0,
      }),
    });
    // Use sendBeacon for reliability on page unload
    navigator.sendBeacon(
      `${API_BASE}/videos/${videoId}/analytics`,
      new Blob(
        [JSON.stringify({ ...JSON.parse(payload), token })],
        { type: 'application/json' }
      )
    );
  }, [videoId]);

  // Video Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      watchStartRef.current = Date.now();
      // Send video_view only once per mount
      if (!hasCountedView.current) {
        hasCountedView.current = true;
        sendAnalyticsEvent('video_view');
      }
      // Periodic beacon every 15s
      analyticsTimerRef.current = setInterval(() => {
        if (watchStartRef.current !== null) {
          const elapsed = (Date.now() - watchStartRef.current) / 1000;
          totalWatchedRef.current += elapsed;
          watchStartRef.current = Date.now();
          sendAnalyticsEvent('video_progress', { watchedSeconds: Math.round(totalWatchedRef.current) });
        }
      }, 15000);
    };

    const onPause = () => {
      setIsPlaying(false);
      if (watchStartRef.current !== null) {
        totalWatchedRef.current += (Date.now() - watchStartRef.current) / 1000;
        watchStartRef.current = null;
      }
      if (analyticsTimerRef.current) {
        clearInterval(analyticsTimerRef.current);
        analyticsTimerRef.current = null;
      }
      sendAnalyticsEvent('video_paused', { watchedSeconds: Math.round(totalWatchedRef.current) });
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (watchStartRef.current !== null) {
        totalWatchedRef.current += (Date.now() - watchStartRef.current) / 1000;
        watchStartRef.current = null;
      }
      if (analyticsTimerRef.current) {
        clearInterval(analyticsTimerRef.current);
        analyticsTimerRef.current = null;
      }
      sendAnalyticsEvent('video_completed', {
        watchedSeconds: Math.round(totalWatchedRef.current),
        completionRate: 100,
      });
    };

    const onSeeking = () => sendAnalyticsEvent('video_seeked', { seekTo: video.currentTime });
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => { setVolume(video.volume); setIsMuted(video.muted); };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    // Beacon on page unload
    const onBeforeUnload = () => {
      if (watchStartRef.current !== null) {
        totalWatchedRef.current += (Date.now() - watchStartRef.current) / 1000;
      }
      if (totalWatchedRef.current > 0) {
        sendBeaconEvent('video_exit', Math.round(totalWatchedRef.current));
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (analyticsTimerRef.current) clearInterval(analyticsTimerRef.current);
    };
  }, [sendAnalyticsEvent, sendBeaconEvent]);

  // Controls Visibility
  const hideControls = useCallback(() => {
    if (isPlaying) setShowControls(false);
  }, [isPlaying]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(hideControls, 3000);
  }, [hideControls]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimeout]);

  // Fullscreen Events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Control Actions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolume = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleQualityChange = (levelIndex: number) => {
    if (hls) {
      hls.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group bg-black overflow-hidden flex items-center justify-center",
        isFullscreen ? "w-screen h-screen" : "w-full aspect-video rounded-xl",
        className
      )}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
      />
      
      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/20 border-t-brand-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Title Overlay (Top) */}
      {title && (
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 pointer-events-none",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          <h2 className="text-white font-medium text-lg drop-shadow-md truncate">{title}</h2>
        </div>
      )}

      {/* Bottom Controls */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent toggling play when clicking controls
      >
        <VideoControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          levels={levels}
          currentLevel={currentLevel}
          onPlayPause={togglePlay}
          onSeek={handleSeek}
          onVolumeChange={handleVolume}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onQualityChange={handleQualityChange}
        />
      </div>
    </div>
  );
}
