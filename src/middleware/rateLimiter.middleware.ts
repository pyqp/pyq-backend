import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis.config';

const makeStore = () => {
  try {
    return new RedisStore({
      // @ts-expect-error — ioredis sendCommand vs node-redis signature differs
      sendCommand: (...args: string[]) => redis.call(...args),
    });
  } catch {
    return undefined; // Fall back to memory store if Redis unavailable
  }
};

const store = makeStore();

/**
 * General API — 100 req / 15 min per IP
 */
export const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  store,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
});

/**
 * Auth routes — 20 req / 15 min (prevent brute force)
 */
export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  store,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

/**
 * OTP / email resend — 5 req / 10 min
 */
export const otpLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  store,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes.' },
});

/**
 * Payment routes — 30 req / 15 min
 */
export const paymentLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  store,
  message: { success: false, message: 'Too many payment requests. Please try again later.' },
});

/**
 * Test start — 10 req / 10 min (prevent credit farming)
 */
export const testLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  store,
  message: { success: false, message: 'Too many test attempts. Please wait a few minutes.' },
});

/**
 * Contact form — 5 req / 1 hour
 */
export const contactLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  store,
  message: { success: false, message: 'Too many contact submissions. Please wait an hour.' },
});