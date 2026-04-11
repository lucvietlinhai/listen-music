import Redis from "ioredis";
import { config } from "../config";

type CacheValue<T> = {
  expiresAt: number;
  data: T;
};

class MemoryCache {
  readonly mode = "memory" as const;
  private readonly map = new Map<string, CacheValue<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.map.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return item.data as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.map.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }

  async ping(): Promise<"PONG"> {
    return "PONG";
  }
}

class RedisCache {
  readonly mode = "redis" as const;
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async ping(): Promise<"PONG"> {
    await this.redis.connect();
    const pong = await this.redis.ping();
    return pong as "PONG";
  }
}

export type CacheClient = MemoryCache | RedisCache;

export const createCacheClient = (): CacheClient => {
  if (!config.redisUrl) {
    return new MemoryCache();
  }
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true
  });
  return new RedisCache(redis);
};
