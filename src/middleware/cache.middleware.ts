import { Request, Response, NextFunction } from 'express';
import redis, { redisAvailable } from '../config/redis.config';
import logger from '../utils/logger';

// ── FIX: wrapped every redis.setex call in try/catch so a Redis error
//         can NEVER bubble up and crash the response with a 500.
//         Root cause: nullRedis was missing setex, which threw synchronously
//         inside res.json override, which Express caught and sent as 500 HTML.

/**
 * Route-level cache middleware
 * Usage: router.get('/packages', cache(900), controller)
 * If Redis is down → silently skips caching, request continues normally.
 */
export const cache = (ttl: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') { next(); return; }

    // Skip entirely if Redis not connected — avoids any risk
    if (!redisAvailable) { next(); return; }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        logger.debug(`Cache HIT: ${key}`);
        res.json(JSON.parse(cached));
        return;
      }

      logger.debug(`Cache MISS: ${key}`);

      // Intercept res.json to store response — NEVER allow this to throw
      const originalJson = res.json.bind(res);
      (res as any).json = (data: any) => {
        // Fire-and-forget — errors silently discarded
        try {
          redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
        } catch {
          // nullRedis or Redis error — ignore completely
        }
        return originalJson(data);
      };

      next();
    } catch {
      // Any Redis failure → serve without cache
      next();
    }
  };
};

/**
 * User-scoped cache (avoids leaking user A's data to user B)
 * Usage: router.get('/dashboard', protect, cacheUser(60), controller)
 */
export const cacheUser = (ttl: number) => {
  return async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') { next(); return; }
    if (!redisAvailable) { next(); return; }

    const userId = req.user?._id?.toString() ?? 'anon';
    const key    = `cache:user:${userId}:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      const originalJson = res.json.bind(res);
      (res as any).json = (data: any) => {
        try {
          redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
        } catch {
          // ignore
        }
        return originalJson(data);
      };

      next();
    } catch {
      next();
    }
  };
};

/**
 * Invalidate all cache keys matching a pattern
 * Usage: await invalidateCache('cache:/api/v1/packages*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  if (!redisAvailable) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (err: any) {
    logger.warn(`Cache invalidation failed: ${err.message}`);
  }
};

/**
 * Clear all cached responses for a specific user
 */
export const clearUserCache = async (userId: string): Promise<void> => {
  await invalidateCache(`cache:user:${userId}:*`);
};