import "dotenv/config";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: toNumber(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN ?? process.env.CORS_ORIGIN ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL",
  fptAiApiKey: process.env.FPTAI_API_KEY
};
