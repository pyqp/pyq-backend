import Redis from 'ioredis';
import logger from '../utils/logger';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error: Error) => {
  logger.error(`Redis connection error: ${error.message}`);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Helper functions
export const cacheMiddleware = (duration: number) => {
  return async (req: any, res: any, next: any) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);

      if (cached) {
        logger.info(`Cache HIT: ${key}`);
        return res.json(JSON.parse(cached));
      }

      logger.info(`Cache MISS: ${key}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      res.json = (data: any) => {
        // Cache the response
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error: any) {
      logger.error(`Cache error: ${error.message}`);
      next(); // Continue without cache if Redis fails
    }
  };
};

// Clear cache by pattern
export const clearCache = async (pattern: string): Promise<number> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
      return keys.length;
    }
    return 0;
  } catch (error: any) {
    logger.error(`Error clearing cache: ${error.message}`);
    return 0;
  }
};

export default redis;