import { createHash } from "crypto";
import { config } from "../config";
import type { CacheClient } from "./cache";

export type VoiceSynthesisResult = {
  provider: "elevenlabs" | "mock";
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
  const hash = createHash("sha256").update(text).digest("hex");
  return `tts:v1:${hash}`;
};

const toDataUrl = (buffer: Buffer, mime = "audio/mpeg") => `data:${mime};base64,${buffer.toString("base64")}`;

const synthesizeElevenLabs = async (text: string): Promise<string | null> => {
  if (!config.elevenLabsApiKey) {
    return null;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": config.elevenLabsApiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ELEVENLABS_FAILED: ${response.status} ${detail.slice(0, 180)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return toDataUrl(Buffer.from(arrayBuffer), "audio/mpeg");
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

      try {
        const elevenAudio = await synthesizeElevenLabs(normalized);
        if (elevenAudio) {
          provider = "elevenlabs";
          audioUrl = elevenAudio;
        }
      } catch (error) {
        console.error("tts elevenlabs fallback", error);
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
