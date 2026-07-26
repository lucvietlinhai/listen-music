import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";

const BUCKET = "tts-audio";

export type StorageClient = {
  /**
   * Upload an audio buffer and return a public URL.
   * Returns null if storage is not configured or upload fails.
   */
  uploadAudio(key: string, buffer: Buffer): Promise<string | null>;
  readonly mode: "supabase" | "noop";
};

// ---------------------------------------------------------------------------
// Noop implementation — used when Supabase storage is not configured
// ---------------------------------------------------------------------------
class NoopStorage implements StorageClient {
  readonly mode = "noop" as const;
  async uploadAudio(_key: string, _buffer: Buffer): Promise<string | null> {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Supabase Storage implementation
// ---------------------------------------------------------------------------
class SupabaseStorage implements StorageClient {
  readonly mode = "supabase" as const;
  private readonly client: SupabaseClient;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });
  }

  async uploadAudio(key: string, buffer: Buffer): Promise<string | null> {
    const path = `${key}.mp3`;

    try {
      const { error } = await this.client.storage
        .from(BUCKET)
        .upload(path, buffer, {
          contentType: "audio/mpeg",
          upsert: true,
          cacheControl: "86400" // 1 day CDN cache
        });

      if (error) {
        console.warn("[TTS:storage] Upload failed:", error.message, { key });
        return null;
      }

      const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.warn("[TTS:storage] Unexpected upload error:", err instanceof Error ? err.message : String(err), { key });
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export const createStorageClient = (): StorageClient => {
  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    console.log("[TTS:storage] Using Supabase Storage (bucket: tts-audio)");
    return new SupabaseStorage(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  console.log("[TTS:storage] Storage not configured — audio will use data URL fallback");
  return new NoopStorage();
};
