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
      player.loadVideoById({ videoId, startSeconds: Math.max(0, Math.floor(currentTime)) });
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

  return <div id={PLAYER_ID} className="h-56 w-full overflow-hidden rounded-xl sm:h-72" />;
}
