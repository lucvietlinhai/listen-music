import { createHash } from "crypto";
import { config } from "../config";
import type { CacheClient } from "./cache";
import type { StorageClient } from "./supabase-storage";

export type VoiceSynthesisResult = {
  provider: "fptai" | "mock";
  transcript: string;
  audioUrl: string | null;
  cacheHit: boolean;
};

export type TtsService = {
  synthesize: (input: { roomId: string; text: string }) => Promise<VoiceSynthesisResult>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * If Supabase Storage is NOT configured, data URLs are cached in Redis.
 * Skip caching if the data URL is too large to avoid Redis bloat.
 */
const MAX_DATA_URL_CACHE_BYTES = 200_000; // 200 KB

// FPT AI polling: exponential backoff with jitter
const POLL_MAX_ATTEMPTS = 6;
const POLL_BASE_DELAY_MS = 500;
const POLL_MAX_DELAY_MS = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ").slice(0, 500);

const buildCacheKey = (text: string) => {
  const voiceSignature = config.fptAiApiKey
    ? `fptai:${config.fptAiVoice}:${config.fptAiSpeed}`
    : "mock";
  const hash = createHash("sha256").update(`${voiceSignature}:${text}`).digest("hex");
  return `tts:v4:${hash}`;
};

const buildStorageKey = (text: string) => {
  const hash = createHash("sha256")
    .update(`${config.fptAiVoice}:${config.fptAiSpeed}:${text}`)
    .digest("hex")
    .slice(0, 32);
  return hash;
};

const toDataUrl = (buffer: Buffer, mime = "audio/mpeg") =>
  `data:${mime};base64,${buffer.toString("base64")}`;

/**
 * Exponential backoff delay with ±20% jitter.
 */
const backoffDelay = (attempt: number): number => {
  const base = Math.min(POLL_BASE_DELAY_MS * 2 ** attempt, POLL_MAX_DELAY_MS);
  const jitter = base * 0.2 * (Math.random() * 2 - 1); // ±20%
  return Math.max(100, Math.round(base + jitter));
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// FPT AI — fetch async audio with exponential backoff
// ---------------------------------------------------------------------------
const fetchFptAudioBuffer = async (url: string): Promise<Buffer | null> => {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, { headers: { Accept: "audio/mpeg" } });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      const delay = backoffDelay(attempt);
      console.warn(
        `[TTS:fptai] Poll attempt ${attempt + 1}/${POLL_MAX_ATTEMPTS} failed (HTTP ${response.status}), retrying in ${delay}ms`,
        { url }
      );
      await sleep(delay);
    } catch (err) {
      const delay = backoffDelay(attempt);
      console.warn(
        `[TTS:fptai] Poll attempt ${attempt + 1}/${POLL_MAX_ATTEMPTS} threw error, retrying in ${delay}ms`,
        { error: err instanceof Error ? err.message : String(err) }
      );
      await sleep(delay);
    }
  }

  console.error(`[TTS:fptai] All ${POLL_MAX_ATTEMPTS} poll attempts exhausted`, { url });
  return null;
};

const synthesizeFptAi = async (text: string): Promise<{ buffer: Buffer; asyncUrl: string } | null> => {
  if (!config.fptAiApiKey) return null;

  let response: Response;
  try {
    response = await fetch("https://api.fpt.ai/hmi/tts/v5", {
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
  } catch (err) {
    throw new Error(`FPTAI_REQUEST_FAILED: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`FPTAI_HTTP_ERROR: ${response.status} ${detail.slice(0, 180)}`);
  }

  const payload = (await response.json()) as {
    error?: number;
    async?: string;
    message?: string;
  };

  if (payload.error && payload.error !== 0) {
    throw new Error(`FPTAI_API_ERROR: code=${payload.error} ${payload.message ?? "UNKNOWN"}`);
  }

  if (!payload.async) {
    console.warn("[TTS:fptai] No async URL in response — TTS may not be supported for this input");
    return null;
  }

  const buffer = await fetchFptAudioBuffer(payload.async);
  if (!buffer) return null;

  return { buffer, asyncUrl: payload.async };
};

// ---------------------------------------------------------------------------
// TTS Service factory
// ---------------------------------------------------------------------------
export const createTtsService = (cache: CacheClient, storage?: StorageClient): TtsService => {
  return {
    synthesize: async ({ roomId: _roomId, text }) => {
      const normalized = normalizeText(text);
      const cacheKey = buildCacheKey(normalized);

      // --- Cache hit ---
      const cached = await cache.get<VoiceSynthesisResult>(cacheKey);
      if (cached) {
        console.log("[TTS] Cache hit", {
          provider: cached.provider,
          audioUrl: cached.audioUrl ? cached.audioUrl.slice(0, 80) + "…" : null
        });
        return { ...cached, cacheHit: true };
      }

      // --- Mock mode (no FPT AI key) ---
      if (!config.fptAiApiKey) {
        const result: VoiceSynthesisResult = {
          provider: "mock",
          transcript: normalized,
          audioUrl: null,
          cacheHit: false
        };
        await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
        return result;
      }

      // --- FPT AI synthesis ---
      const t0 = Date.now();
      try {
        const synthesis = await synthesizeFptAi(normalized);

        if (!synthesis) {
          // Synthesis returned nothing (no async URL) — graceful degradation
          const result: VoiceSynthesisResult = {
            provider: "mock",
            transcript: normalized,
            audioUrl: null,
            cacheHit: false
          };
          await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
          return result;
        }

        const { buffer } = synthesis;
        let audioUrl: string | null = null;

        // --- Try Supabase Storage first ---
        if (storage && storage.mode === "supabase") {
          const storageKey = buildStorageKey(normalized);
          const publicUrl = await storage.uploadAudio(storageKey, buffer);
          if (publicUrl) {
            audioUrl = publicUrl;
            console.log("[TTS:fptai] Audio uploaded to Supabase Storage", {
              key: storageKey,
              url: publicUrl,
              sizeKb: Math.round(buffer.byteLength / 1024),
              elapsedMs: Date.now() - t0
            });
          }
        }

        // --- Fallback: data URL (skip cache if too large) ---
        if (!audioUrl) {
          const dataUrl = toDataUrl(buffer);
          const sizeBytes = Buffer.byteLength(dataUrl, "utf8");

          if (sizeBytes <= MAX_DATA_URL_CACHE_BYTES) {
            audioUrl = dataUrl;
            console.log("[TTS:fptai] Using data URL (within size limit)", {
              sizeKb: Math.round(sizeBytes / 1024),
              elapsedMs: Date.now() - t0
            });
          } else {
            // Too large for cache — send the async URL directly, client will fetch
            audioUrl = synthesis.asyncUrl;
            console.warn("[TTS:fptai] Data URL too large for cache, using async URL directly", {
              sizeKb: Math.round(sizeBytes / 1024),
              maxKb: Math.round(MAX_DATA_URL_CACHE_BYTES / 1024),
              elapsedMs: Date.now() - t0
            });
          }
        }

        const result: VoiceSynthesisResult = {
          provider: "fptai",
          transcript: normalized,
          audioUrl,
          cacheHit: false
        };

        // Only cache if URL is not a short-lived async URL (those can expire)
        const shouldCache = audioUrl !== synthesis.asyncUrl;
        if (shouldCache) {
          await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[TTS:fptai] Synthesis failed, falling back to mock", {
          error: message,
          elapsedMs: Date.now() - t0
        });
        throw error; // Let emitVoiceMessage handle it and send fallbackWebSpeech: true
      }
    }
  };
};
