import crypto from 'crypto';

/**
 * Generate a unique referral code
 */
export const generateReferralCode = (name: string): string => {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
  const randomString = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${cleanName}${randomString}`;
};

/**
 * Generate a random string for tokens
 */
export const generateRandomToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100; // 2 decimal places
};

/**
 * Calculate percentile
 */
export const calculatePercentile = (rank: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round(((total - rank) / total) * 10000) / 100;
};

/**
 * Generate batch ID for credits
 */
export const generateBatchId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex');
  return `BATCH_${timestamp}_${random}`.toUpperCase();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
};

/**
 * Calculate time difference in minutes
 */
export const getTimeDifferenceInMinutes = (start: Date, end: Date): number => {
  return Math.round((end.getTime() - start.getTime()) / 60000);
};

/**
 * Format date to Indian format
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Sleep function for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if date is expired
 */
export const isExpired = (date: Date): boolean => {
  return new Date(date).getTime() < Date.now();
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Generate OTP
 */
export const generateOTP = (length = 6): string => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};