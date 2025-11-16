import Redis from 'ioredis';
import { config } from '../config';

class Cache {
  private client: Redis;
  private static instance: Cache;

  private constructor() {
    try {
      this.client = new Redis(config.redis.url, {
        password: config.redis.password,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          // Only retry once
          if (times > 1) {
            console.warn('⚠️  Redis unavailable - caching disabled');
            return null;
          }
          return 50;
        },
        reconnectOnError: (err) => {
          return false;
        },
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        console.warn('⚠️  Redis error (caching disabled):', err.message);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
      });

      // Try to connect
      this.client.connect().catch(() => {
        console.warn('⚠️  Redis not available - API will work without caching');
      });
    } catch (error) {
      console.warn('⚠️  Redis initialization failed - caching disabled');
    }
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client || this.client.status !== 'ready') {
        return null;
      }
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      // Silently fail - caching is optional
      return null;
    }
  }

  public async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      if (!this.client || this.client.status !== 'ready') {
        return;
      }
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      // Silently fail - caching is optional
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  public async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.client && this.client.status === 'ready') {
        await this.client.quit();
      }
    } catch (error) {
      // Silently fail - Redis may not be available
      console.debug('Redis close error (non-critical):', error instanceof Error ? error.message : String(error));
    }
  }

  // Helper methods for common cache patterns
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  // Rate limiting helper
  public async incrementCounter(
    key: string,
    ttl: number = 60
  ): Promise<number> {
    try {
      if (!this.client || this.client.status !== 'ready') {
        return 0; // No rate limiting if Redis unavailable
      }
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec();
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      // Silently fail - rate limiting disabled without Redis
      return 0;
    }
  }
}

export const cache = Cache.getInstance();

// Cache key helpers
export const CacheKeys = {
  tokenMetadata: (mint: string) => `token:metadata:${mint}`,
  tokenPrice: (mint: string) => `token:price:${mint}`,
  bondingCurve: (mint: string) => `token:bonding:${mint}`,
  tokenFull: (mint: string) => `token:full:${mint}`,
  recentTokens: (category: string = 'all') => `tokens:recent:${category}`,
  apiKeyData: (key: string) => `apikey:${key}`,
  rateLimitKey: (apiKeyId: string, window: string) => `ratelimit:${apiKeyId}:${window}`,
} as const;
