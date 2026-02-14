import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from:    `"${process.env.FROM_NAME || 'PYQPB'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to:      options.to,
    subject: options.subject,
    html:    options.html,
    text:    options.text || options.html.replace(/<[^>]*>/g, ''),
  };

  await transporter.sendMail(mailOptions);
  logger.info(`Email sent to ${options.to}: ${options.subject}`);
};

export default sendEmail;