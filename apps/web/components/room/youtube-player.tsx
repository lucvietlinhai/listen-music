"use client";

import { useEffect, useRef, useState } from "react";

type YoutubePlayerProps = {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  showVideo?: boolean;
  volume?: number;
  onDurationChange?: (duration: number) => void;
};

type YTPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  loadVideoById: (args: { videoId: string; startSeconds?: number }) => void;
  cueVideoById: (args: { videoId: string; startSeconds?: number }) => void;
  getIframe: () => HTMLIFrameElement | null;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, any>;
          events?: { onReady?: () => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYER_ID = "lwm-youtube-player";

export function YoutubePlayer({
  videoId,
  isPlaying,
  currentTime,
  showVideo = true,
  volume = 100,
  onDurationChange
}: YoutubePlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const initializedVideoRef = useRef(videoId);
  const initialVideoIdRef = useRef(videoId);
  const initialPlayingRef = useRef(isPlaying);
  const [ready, setReady] = useState(false);

  // Initialize YouTube IFrame API once
  useEffect(() => {
    let mounted = true;

    const createPlayer = () => {
      if (!mounted || !window.YT?.Player || playerRef.current) return;
      playerRef.current = new window.YT.Player(PLAYER_ID, {
        videoId: initialVideoIdRef.current,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: initialPlayingRef.current ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: () => {
            if (!mounted) return;
            setReady(true);
          }
        }
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.body.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        createPlayer();
      };
    }

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Sync playback state
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ready) return;

    if (initializedVideoRef.current !== videoId) {
      const startSeconds = Math.max(0, Math.floor(currentTime));
      if (isPlaying) {
        player.loadVideoById({ videoId, startSeconds });
      } else {
        player.cueVideoById({ videoId, startSeconds });
      }
      initializedVideoRef.current = videoId;
      return;
    }

    const current = player.getCurrentTime();
    if (Math.abs(current - currentTime) > 2) {
      player.seekTo(currentTime, true);
    }

    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [videoId, currentTime, isPlaying, ready]);

  // Sync volume
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ready) return;
    player.setVolume(volume);
  }, [volume, ready]);

  // Emit duration periodically
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ready || !onDurationChange) return;

    const emitDuration = () => {
      const duration = player.getDuration();
      if (Number.isFinite(duration) && duration > 0) {
        onDurationChange(duration);
      }
    };

    emitDuration();
    const timer = window.setInterval(emitDuration, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [videoId, ready, onDurationChange]);

  const BAR_COUNT = 80;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-[#0a0a0a]">
      {/* 
        The iframe container is ALWAYS rendered at aspect-video size.
        When in wave mode, we visually collapse the outer wrapper but keep the
        iframe alive off-screen so it continues playing audio.
      */}
      <div className={`relative transition-all duration-500 ease-in-out ${
        showVideo ? "aspect-video" : "h-[72px] sm:h-20"
      }`}>
        {/* YouTube iframe — always aspect-video, hidden behind wave overlay when not in video mode */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            showVideo 
              ? "opacity-100 pointer-events-auto z-10" 
              : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <div
            id={PLAYER_ID}
            className="h-full w-full"
          />
        </div>

        {/* Audio wave visualizer overlay — shown when video mode is off */}
        <div className={`absolute inset-0 z-20 flex items-center gap-4 px-5 transition-all duration-500 ${
          showVideo ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          {/* Animated status dot */}
          <div className="relative shrink-0">
            <span className={`status-dot ${isPlaying ? "connected" : "disconnected"}`} />
          </div>

          {/* Wave bars */}
          <div className="relative h-10 flex-1">
            <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-end justify-center gap-[2px]">
              {Array.from({ length: BAR_COUNT }).map((_, index) => {
                const center = BAR_COUNT / 2;
                const distance = Math.abs(index - center);
                const maxHeight = 28;
                const baseHeight = Math.max(3, maxHeight - distance * 0.55);
                return (
                  <span
                    key={index}
                    className={`inline-block w-[2px] rounded-full ${isPlaying ? "eq-bar" : ""}`}
                    style={{
                      height: `${baseHeight}px`,
                      opacity: isPlaying ? 0.9 : 0.2,
                      backgroundColor: "var(--accent)",
                      animationDelay: `${index * 0.015}s`,
                      animationDuration: `${0.6 + (index % 7) * 0.06}s`,
                      filter: isPlaying ? "drop-shadow(0 0 5px var(--accent-glow))" : "none"
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Status label */}
          <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
            isPlaying ? "bg-accent/15 text-accent" : "bg-white/[0.05] text-muted"
          }`}>
            {isPlaying ? "Live" : "Paused"}
          </span>
        </div>
      </div>
    </div>
  );
}
