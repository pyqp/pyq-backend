import transporter from '../config/email.config';
import logger from '../utils/logger';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Skip silently if email is not configured (local dev)
  const configured = !!(process.env.SMTP_USER || process.env.EMAIL_USERNAME);
  if (!configured) {
    logger.info(`[Email skipped — not configured] To: ${options.email} | Subject: ${options.subject}`);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL
        ? `${process.env.FROM_NAME || 'PYQPB'} <${process.env.FROM_EMAIL}>`
        : 'PYQPB <noreply@pyqpb.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.email}`);
  } catch (error: any) {
    logger.error(`Error sending email: ${error.message}`);
    // Do NOT re-throw — email failure should never break register/login
  }
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const message = `
    Hi ${name},
    
    Thank you for registering with PYQPB!
    
    Please verify your email address by clicking the link below:
    ${verifyUrl}
    
    This link will expire in 24 hours.
    
    If you did not create this account, please ignore this email.
    
    Best regards,
    PYQPB Team
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PYQPB!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for registering with PYQPB - Your exam preparation partner!</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${verifyUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you did not create this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 PYQPB. All rights reserved.</p>
          <p>Need help? Contact us at support@pyqpb.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({
    email,
    subject: 'Verify Your Email - PYQPB',
    message,
    html,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const message = `
    Hi ${name},
    
    You requested to reset your password for your PYQPB account.
    
    Please click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you did not request this, please ignore this email and your password will remain unchanged.
    
    Best regards,
    PYQPB Team
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>You requested to reset your password for your PYQPB account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ This link will expire in 1 hour.</strong>
          </div>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p>For security reasons, we recommend changing your password regularly.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 PYQPB. All rights reserved.</p>
          <p>Need help? Contact us at support@pyqpb.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({
    email,
    subject: 'Reset Your Password - PYQPB',
    message,
    html,
  });
};

/**
 * Send welcome email (after email verification)
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<void> => {
  const message = `
    Hi ${name},
    
    Welcome to PYQPB! 🎉
    
    Your email has been verified successfully. You can now access all features of PYQPB.
    
    Here's what you can do:
    - Browse 50+ exam categories
    - Download latest year PYQs for FREE
    - Take professional mock tests
    - Track your performance with detailed analytics
    - Compete on All India Rankings
    
    Get started: ${process.env.FRONTEND_URL}/dashboard
    
    Happy learning!
    PYQPB Team
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10B981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to PYQPB!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Your email has been verified successfully! You're all set to start your exam preparation journey.</p>
          
          <h3>What you can do now:</h3>
          
          <div class="feature">
            <strong>📚 Browse 50+ Exams</strong><br>
            SSC, Railway, UPSC, Banking, Defence & more
          </div>
          
          <div class="feature">
            <strong>📥 Download FREE PYQs</strong><br>
            Latest year (2024) previous year questions
          </div>
          
          <div class="feature">
            <strong>🎯 Take Mock Tests</strong><br>
            Professional mock tests with All India Rankings
          </div>
          
          <div class="feature">
            <strong>📊 Track Performance</strong><br>
            Detailed analytics showing strengths & weaknesses
          </div>
          
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
          
          <p>Need help getting started? Check out our <a href="${process.env.FRONTEND_URL}/how-it-works">How It Works</a> guide.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 PYQPB. All rights reserved.</p>
          <p>Need help? Contact us at support@pyqpb.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({
    email,
    subject: 'Welcome to PYQPB! 🎉',
    message,
    html,
  });
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};