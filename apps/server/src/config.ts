import "dotenv/config";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: toNumber(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  redisUrl: process.env.REDIS_URL,
  youtubeApiKey: process.env.YOUTUBE_API_KEY
};

