import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import type { CacheClient } from "../lib/cache";
import type { YoutubeVideo } from "../types";

const querySchema = z.object({
  q: z.string().trim().min(1).max(120)
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

  return youtubeRouter;
};

