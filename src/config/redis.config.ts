import Redis from 'ioredis';
import logger from '../utils/logger';

let redisAvailable = false;

// ── nullRedis: safe no-op fallback when Redis is not running ──────────────────
// FIX: added setex (and all other methods) that were missing and caused
//      "redis_config_1.default.setex is not a function" on GET /packages
const nullRedis = {
  get:     async () => null as string | null,
  set:     async () => 'OK' as const,
  setex:   async () => 'OK' as const,   // ← THE FIX
  del:     async () => 0,
  keys:    async () => [] as string[],
  call:    async () => null,
  on:      () => nullRedis,
  expire:  async () => 0,
  exists:  async () => 0,
  incr:    async () => 0,
  decr:    async () => 0,
  hget:    async () => null,
  hset:    async () => 0,
  hdel:    async () => 0,
  hgetall: async () => null,
  llen:    async () => 0,
  rpush:   async () => 0,
  lpop:    async () => null,
  publish: async () => 0,
  quit:    async () => 'OK' as const,
} as unknown as Redis;

let redis: Redis = nullRedis;

const REDIS_URL  = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST;

if (REDIS_URL || REDIS_HOST || process.env.NODE_ENV === 'production') {
  let client: Redis;

  if (REDIS_URL) {
    client = new Redis(REDIS_URL, {
      retryStrategy:       (times) => (times > 3 ? null : Math.min(times * 200, 3000)),
      maxRetriesPerRequest: 3,
      enableOfflineQueue:   false,
      lazyConnect:          true,
    });
  } else {
    client = new Redis({
      host:     REDIS_HOST || 'localhost',
      port:     parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        if (process.env.NODE_ENV !== 'production' && times > 3) {
          logger.warn('Redis unavailable — stopping retries');
          return null;
        }
        return Math.min(times * 200, 3000);
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue:   false,
      lazyConnect:          true,
    });
  }

  client.on('connect', () => { redisAvailable = true;  logger.info('Redis connected'); });
  client.on('close',   () => { redisAvailable = false; logger.warn('Redis connection closed'); });
  client.on('error',   (e: Error) => logger.error(`Redis error: ${e.message}`));

  client.connect().catch(() => {
    logger.warn('Redis not available — caching disabled');
  });

  redis = client;
} else {
  logger.info('Redis not configured — caching skipped (add REDIS_HOST to .env to enable)');
}

export { redisAvailable };
export default redis;