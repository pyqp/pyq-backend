import rateLimit from 'express-rate-limit';

/**
 * Each limiter must get its OWN RedisStore instance (different prefix).
 * express-rate-limit throws ERR_ERL_STORE_REUSE if a store is shared.
 * Falls back to in-memory store if rate-limit-redis / Redis is unavailable.
 */
const makeStore = (prefix: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RedisStore = require('rate-limit-redis');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redis = require('../config/redis').default;
    return {
      store: new RedisStore({
        prefix,
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
    };
  } catch {
    // rate-limit-redis not installed or Redis not running → memory store
    return {};
  }
};

const make = (prefix: string, windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    message:         { success: false, message },
    ...makeStore(prefix),          // fresh store per limiter
  });

/** General API — 100 req / 15 min */
export const apiLimiter = make(
  'rl:api:', 15 * 60 * 1000, 100,
  'Too many requests. Please try again after 15 minutes.'
);

/** Auth routes — 20 req / 15 min */
export const authLimiter = make(
  'rl:auth:', 15 * 60 * 1000, 20,
  'Too many login attempts. Please try again after 15 minutes.'
);

/** OTP / email resend — 5 req / 10 min */
export const otpLimiter = make(
  'rl:otp:', 10 * 60 * 1000, 5,
  'Too many OTP requests. Please wait 10 minutes.'
);

/** Payment routes — 30 req / 15 min */
export const paymentLimiter = make(
  'rl:payment:', 15 * 60 * 1000, 30,
  'Too many payment requests. Please try again later.'
);

/** Test start — 10 req / 10 min */
export const testLimiter = make(
  'rl:test:', 10 * 60 * 1000, 10,
  'Too many test attempts. Please wait a few minutes.'
);

/** Contact form — 5 req / 1 hour */
export const contactLimiter = make(
  'rl:contact:', 60 * 60 * 1000, 5,
  'Too many contact submissions. Please wait an hour.'
);