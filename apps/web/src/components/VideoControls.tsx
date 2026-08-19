'use client';

import React, { useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, Minimize, Settings, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Level {
  height: number;
  bitrate: number;
}

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  levels: Level[];
  currentLevel: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onQualityChange: (level: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VolumeIcon({ volume, isMuted }: { volume: number; isMuted: boolean }) {
  if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
  if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
  return <Volume2 className="w-5 h-5" />;
}

function getQualityLabel(level: Level): string {
  if (level.height >= 1080) return '1080p';
  if (level.height >= 720) return '720p';
  if (level.height >= 480) return '480p';
  if (level.height >= 360) return '360p';
  return `${level.height}p`;
}

export default function VideoControls({
  isPlaying, currentTime, duration, volume, isMuted,
  isFullscreen, levels, currentLevel,
  onPlayPause, onSeek, onVolumeChange, onToggleMute,
  onToggleFullscreen, onQualityChange
}: VideoControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverTime(ratio * duration);
    setHoverX(e.clientX - rect.left);
  };

  return (
    <div className="select-none">
      {/* Progress Bar */}
      <div
        className="relative h-1 w-full rounded-full bg-white/25 cursor-pointer group/progress mb-3"
        onClick={handleProgressClick}
        onMouseMove={handleProgressHover}
        onMouseLeave={() => setHoverTime(null)}
      >
        {/* Hover time tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-7 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-0.5 rounded pointer-events-none whitespace-nowrap"
            style={{ left: hoverX }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Buffered track */}
        <div className="absolute inset-0 rounded-full bg-white/20" />

        {/* Played track */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />

        {/* Hover indicator */}
        {hoverTime !== null && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-all duration-75"
            style={{ width: `${(hoverTime / duration) * 100}%` }}
          />
        )}
      </div>

      {/* Control Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left Group */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            id="player-play-pause"
            onClick={onPlayPause}
            className="p-2 rounded-full text-white hover:bg-white/15 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/volume">
            <button
              id="player-volume"
              onClick={onToggleMute}
              className="p-2 rounded-full text-white hover:bg-white/15 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon volume={volume} isMuted={isMuted} />
            </button>

            {/* Volume Slider */}
            <div
              className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                onVolumeChange(Math.max(0, Math.min(1, ratio)));
              }}
            >
              <div className="relative h-1 w-20 rounded-full bg-white/25">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Time Display */}
          <span className="text-white text-sm font-mono tabular-nums">
            {formatTime(currentTime)}
            <span className="text-white/50 mx-1">/</span>
            {formatTime(duration)}
          </span>
        </div>

        {/* Right Group */}
        <div className="flex items-center gap-1">
          {/* Quality / Settings */}
          {levels.length > 1 && (
            <div className="relative">
              <button
                id="player-settings"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
                className={cn(
                  "p-2 rounded-full text-white hover:bg-white/15 transition-colors",
                  showSettings && "bg-white/15"
                )}
                aria-label="Quality settings"
              >
                <Settings className={cn("w-4 h-4 transition-transform duration-300", showSettings && "rotate-45")} />
              </button>

              {showSettings && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-36 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 py-1 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-white/40 text-xs px-3 pt-1 pb-1 uppercase tracking-wider">Quality</p>
                  
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors",
                      currentLevel === -1 && "text-brand-400"
                    )}
                    onClick={() => { onQualityChange(-1); setShowSettings(false); }}
                  >
                    <span>Auto</span>
                    {currentLevel === -1 && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {[...levels].reverse().map((level, revIdx) => {
                    const idx = levels.length - 1 - revIdx;
                    const label = getQualityLabel(level);
                    const isActive = currentLevel === idx;
                    return (
                      <button
                        key={idx}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors",
                          isActive && "text-brand-400"
                        )}
                        onClick={() => { onQualityChange(idx); setShowSettings(false); }}
                      >
                        <span>{label}</span>
                        {isActive && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen */}
          <button
            id="player-fullscreen"
            onClick={onToggleFullscreen}
            className="p-2 rounded-full text-white hover:bg-white/15 transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
