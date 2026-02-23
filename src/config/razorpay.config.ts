import Razorpay from 'razorpay';
import logger from '../utils/logger';

/**
 * Lazily initialised Razorpay instance.
 * Defers construction until first use so missing keys don't crash startup.
 * Export is the instance itself (via Proxy), not a getter — callers use it
 * as a normal Razorpay object: razorpay.orders.create(...)
 */
let _instance: Razorpay | null = null;

const getInstance = (): Razorpay => {
  if (_instance) return _instance;

  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      'Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
    );
  }

  _instance = new Razorpay({ key_id, key_secret });
  logger.info('Razorpay initialised');
  return _instance;
};

// Transparent proxy — any property access (orders, payments, etc.) triggers
// lazy init automatically. Callers import and use like a plain Razorpay object.
const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop: string) {
    return (getInstance() as any)[prop];
  },
});

export default razorpay;