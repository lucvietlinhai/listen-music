import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import type { CacheClient } from "../lib/cache";
import type { YoutubeVideo } from "../types";

const querySchema = z.object({
  q: z.string().trim().min(1).max(120)
});
const resolveSchema = z.object({
  url: z.string().trim().min(8).max(500)
});

const cacheTtlSeconds = 3600;

const mockVideos: YoutubeVideo[] = [
  {
    videoId: "hLQl3WQQoQ0",
    title: "Adele - Someone Like You",
    thumbnail: "https://i.ytimg.com/vi/hLQl3WQQoQ0/hqdefault.jpg",
    channelTitle: "AdeleVEVO"
  },
  {
    videoId: "JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You",
    thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    channelTitle: "Ed Sheeran"
  }
];

export const createYoutubeRouter = (cache: CacheClient) => {
  const youtubeRouter = Router();

  const parseYoutubeVideoId = (value: string) => {
    try {
      const input = value.trim();
      const asUrl = new URL(input.startsWith("http") ? input : `https://${input}`);
      const host = asUrl.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        const id = asUrl.pathname.split("/").filter(Boolean)[0];
        return id || null;
      }
      if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
        if (asUrl.pathname === "/watch") {
          return asUrl.searchParams.get("v");
        }
        if (asUrl.pathname.startsWith("/shorts/")) {
          return asUrl.pathname.split("/")[2] ?? null;
        }
        if (asUrl.pathname.startsWith("/embed/")) {
          return asUrl.pathname.split("/")[2] ?? null;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  youtubeRouter.get("/search", async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION_ERROR", detail: parsed.error.flatten() });
      return;
    }

    const q = parsed.data.q;
    const key = `yt:search:${Buffer.from(q.toLowerCase()).toString("base64url")}`;
    const cached = await cache.get<YoutubeVideo[]>(key);
    if (cached) {
      res.json({ source: "cache", items: cached });
      return;
    }

    let videos: YoutubeVideo[] = mockVideos.map((item) => ({
      ...item,
      title: `${item.title} (${q})`
    }));
    let source = "mock";

    if (config.youtubeApiKey) {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "10");
      url.searchParams.set("q", q);
      url.searchParams.set("key", config.youtubeApiKey);

      const response = await fetch(url.toString());
      if (response.ok) {
        const json = (await response.json()) as {
          items: Array<{
            id: { videoId: string };
            snippet: {
              title: string;
              channelTitle: string;
              thumbnails?: { medium?: { url: string }; default?: { url: string } };
            };
          }>;
        };

        videos = json.items.map((item) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? ""
        }));
        source = "youtube";
      }
    }

    await cache.set(key, videos, cacheTtlSeconds);
    res.json({ source, items: videos });
  });

  youtubeRouter.get("/resolve", async (req, res) => {
    const parsed = resolveSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION_ERROR", detail: parsed.error.flatten() });
      return;
    }

    const videoId = parseYoutubeVideoId(parsed.data.url);
    if (!videoId) {
      res.status(400).json({ error: "YOUTUBE_URL_INVALID" });
      return;
    }

    const key = `yt:resolve:${videoId}`;
    const cached = await cache.get<YoutubeVideo>(key);
    if (cached) {
      res.json({ source: "cache", item: cached });
      return;
    }

    let item: YoutubeVideo = {
      videoId,
      title: `YouTube Video (${videoId})`,
      channelTitle: "YouTube",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
    let source = "mock";

    if (config.youtubeApiKey) {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("id", videoId);
      url.searchParams.set("key", config.youtubeApiKey);

      const response = await fetch(url.toString());
      if (response.ok) {
        const json = (await response.json()) as {
          items: Array<{
            id: string;
            snippet: {
              title: string;
              channelTitle: string;
              thumbnails?: { medium?: { url: string }; default?: { url: string } };
            };
          }>;
        };
        const first = json.items[0];
        if (first) {
          item = {
            videoId: first.id,
            title: first.snippet.title,
            channelTitle: first.snippet.channelTitle,
            thumbnail:
              first.snippet.thumbnails?.medium?.url ??
              first.snippet.thumbnails?.default?.url ??
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          };
          source = "youtube";
        }
      }
    }

    await cache.set(key, item, cacheTtlSeconds);
    res.json({ source, item });
  });

  return youtubeRouter;
};
