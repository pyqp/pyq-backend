import redis from '../config/redis.config';
import logger from '../utils/logger';

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const val = await redis.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch (err: any) {
      logger.warn(`Cache GET failed [${key}]: ${err.message}`);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err: any) {
      logger.warn(`Cache SET failed [${key}]: ${err.message}`);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err: any) {
      logger.warn(`Cache DEL failed [${key}]: ${err.message}`);
    }
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Invalidated ${keys.length} keys: ${pattern}`);
      }
      return keys.length;
    } catch (err: any) {
      logger.warn(`Cache invalidate failed [${pattern}]: ${err.message}`);
      return 0;
    }
  }

  static async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  static async increment(key: string, ttl = 3600): Promise<number> {
    try {
      const val = await redis.incr(key);
      if (val === 1) await redis.expire(key, ttl);
      return val;
    } catch {
      return 0;
    }
  }
}

export default CacheService;