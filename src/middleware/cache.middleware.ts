import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.config';
import logger from '../utils/logger';

/**
 * Route-level cache middleware
 * Usage: router.get('/exams', cache(300), controller)
 *        Caches GET responses for `ttl` seconds.
 */
export const cache = (ttl: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') { next(); return; }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        logger.debug(`Cache HIT: ${key}`);
        res.json(JSON.parse(cached));
        return;
      }

      logger.debug(`Cache MISS: ${key}`);

      // Intercept res.json to store the response
      const originalJson = res.json.bind(res);
      (res as any).json = (data: any) => {
        redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
        return originalJson(data);
      };

      next();
    } catch {
      // Redis failure → serve without cache
      next();
    }
  };
};

/**
 * Invalidate all cache keys matching a pattern
 * Usage: await invalidateCache('cache:/api/v1/exams*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Invalidated ${keys.length} cache keys: ${pattern}`);
    }
  } catch (err: any) {
    logger.warn(`Cache invalidation failed: ${err.message}`);
  }
};

/**
 * User-scoped cache key (avoids leaking user A's data to user B)
 * Usage: cache(60, { userScoped: true })
 */
export const cacheUser = (ttl: number) => {
  return async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') { next(); return; }

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
        redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
        return originalJson(data);
      };

      next();
    } catch {
      next();
    }
  };
};

/**
 * Clear all cache for a user
 */
export const clearUserCache = async (userId: string): Promise<void> => {
  await invalidateCache(`cache:user:${userId}:*`);
};