import Razorpay from 'razorpay';
import logger from '../utils/logger';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// Verify credentials on startup
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  logger.error('Razorpay credentials not found in environment variables');
} else {
  logger.info('Razorpay initialized successfully');
}

export default razorpay;