"use client";

import { useEffect, useRef, useState } from "react";

type YoutubePlayerProps = {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
};

type YTPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (args: { videoId: string; startSeconds?: number }) => void;
  cueVideoById: (args: { videoId: string; startSeconds?: number }) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: { onReady?: () => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYER_ID = "lwm-youtube-player";

export function YoutubePlayer({ videoId, isPlaying, currentTime }: YoutubePlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const initializedVideoRef = useRef(videoId);
  const initialVideoIdRef = useRef(videoId);
  const initialPlayingRef = useRef(isPlaying);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const createPlayer = () => {
      if (!mounted || !window.YT?.Player || playerRef.current) return;
      playerRef.current = new window.YT.Player(PLAYER_ID, {
        videoId: initialVideoIdRef.current,
        playerVars: {
          autoplay: initialPlayingRef.current ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1
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
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = () => {
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

  return (
    <div className="relative h-20 w-full overflow-hidden rounded-lg bg-[#0b1a2b] sm:h-[88px]">
      <div
        id={PLAYER_ID}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0"
        aria-hidden
      />

      <div className="relative z-10 flex h-full items-center gap-3 px-4">
        <span className={`h-2 w-2 rounded-full ${isPlaying ? "bg-emerald-300" : "bg-slate-500"}`} />
        <div className="relative h-10 flex-1">
          <div className="absolute inset-y-1 left-0 right-0 rounded-full bg-cyan-300/5" />
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-[3px]">
            {Array.from({ length: 60 }).map((_, index) => {
              const distance = Math.abs(index - 30);
              const baseHeight = Math.max(4, 16 - distance * 0.28);
              return (
                <span
                  key={index}
                  className={`inline-block w-[2px] rounded-full bg-gradient-to-t from-cyan-300/85 to-sky-100 ${
                    isPlaying ? "eq-bar" : ""
                  }`}
                  style={{
                    height: `${baseHeight}px`,
                    opacity: isPlaying ? 0.95 : 0.32,
                    animationDelay: `${index * 0.018}s`,
                    animationDuration: `${0.72 + (index % 7) * 0.05}s`
                  }}
                />
              );
            })}
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{isPlaying ? "Live" : "Pause"}</span>
      </div>
    </div>
  );
}
