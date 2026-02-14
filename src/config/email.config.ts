import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection
transporter.verify((error: Error | null) => {
  if (error) {
    logger.error(`Email configuration error: ${error.message}`);
  } else {
    logger.info('Email server is ready to send messages');
  }
});

export default transporter;