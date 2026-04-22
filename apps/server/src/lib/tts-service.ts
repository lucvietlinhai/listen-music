import { createHash } from "crypto";
import { config } from "../config";
import type { CacheClient } from "./cache";

export type VoiceSynthesisResult = {
  provider: "fptai" | "mock";
  transcript: string;
  audioUrl: string | null;
  cacheHit: boolean;
};

export type TtsService = {
  synthesize: (input: { roomId: string; text: string }) => Promise<VoiceSynthesisResult>;
};

const CACHE_TTL_SECONDS = 60 * 60 * 24;

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ").slice(0, 500);

const buildCacheKey = (text: string) => {
  const voiceSignature = config.fptAiApiKey ? `fptai:${config.fptAiVoice}:${config.fptAiSpeed}` : "mock";
  const hash = createHash("sha256").update(`${voiceSignature}:${text}`).digest("hex");
  return `tts:v3:${hash}`;
};

const toDataUrl = (buffer: Buffer, mime = "audio/mpeg") => `data:${mime};base64,${buffer.toString("base64")}`;

const fetchFptAudioDataUrl = async (url: string): Promise<string | null> => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(url, { headers: { Accept: "audio/mpeg" } });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return toDataUrl(Buffer.from(arrayBuffer), "audio/mpeg");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return null;
};

const synthesizeFptAi = async (text: string): Promise<string | null> => {
  if (!config.fptAiApiKey) {
    return null;
  }

  const response = await fetch("https://api.fpt.ai/hmi/tts/v5", {
    method: "POST",
    headers: {
      api_key: config.fptAiApiKey,
      voice: config.fptAiVoice,
      speed: config.fptAiSpeed,
      format: "mp3",
      "Content-Type": "text/plain; charset=utf-8"
    },
    body: text
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`FPTAI_FAILED: ${response.status} ${detail.slice(0, 180)}`);
  }

  const payload = (await response.json()) as {
    error?: number;
    async?: string;
    message?: string;
  };
  if (payload.error && payload.error !== 0) {
    throw new Error(`FPTAI_FAILED: ${payload.error} ${payload.message ?? "UNKNOWN"}`);
  }
  if (!payload.async) {
    return null;
  }

  const readyAudio = await fetchFptAudioDataUrl(payload.async);
  if (readyAudio) {
    return readyAudio;
  }
  return payload.async;
};

export const createTtsService = (cache: CacheClient): TtsService => {
  return {
    synthesize: async ({ roomId: _roomId, text }) => {
      const normalized = normalizeText(text);
      const key = buildCacheKey(normalized);
      const cached = await cache.get<VoiceSynthesisResult>(key);
      if (cached) {
        return { ...cached, cacheHit: true };
      }

      let provider: VoiceSynthesisResult["provider"] = "mock";
      let audioUrl: string | null = null;

      const fptAudio = await synthesizeFptAi(normalized);
      if (fptAudio) {
        provider = "fptai";
        audioUrl = fptAudio;
      }

      const result: VoiceSynthesisResult = {
        provider,
        transcript: normalized,
        audioUrl,
        cacheHit: false
      };

      await cache.set(key, result, CACHE_TTL_SECONDS);
      return result;
    }
  };
};
