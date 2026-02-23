import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';

const EMAIL_CONFIGURED =
  !!process.env.SMTP_USER && !!process.env.SMTP_PASS ||
  !!process.env.EMAIL_USERNAME && !!process.env.EMAIL_PASSWORD;

/**
 * Returns a real SMTP transporter when credentials are set,
 * or a no-op stub so the server starts cleanly without email config.
 */
const createTransporter = (): Transporter => {
  if (!EMAIL_CONFIGURED) {
    logger.warn(
      'Email not configured — set SMTP_USER + SMTP_PASS in .env to enable email sending'
    );
    // Ethereal-style stub: accepts calls, logs instead of sending
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USERNAME,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
  });

  // Verify async — never blocks startup
  transporter.verify().then(() => {
    logger.info('Email server ready');
  }).catch((err: Error) => {
    logger.warn(`Email verification failed: ${err.message}`);
  });

  return transporter;
};

const transporter = createTransporter();

export default transporter;