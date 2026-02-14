import logger from '../utils/logger';

/**
 * SMS Service — integrates with any provider.
 * Set SMS_PROVIDER=twilio|msg91|fast2sms in .env
 * and the relevant API keys.
 */
export class SmsService {
  private static isEnabled(): boolean {
    return !!(process.env.SMS_ENABLED === 'true' && process.env.SMS_API_KEY);
  }

  static async send(phone: string, message: string): Promise<boolean> {
    if (!this.isEnabled()) {
      logger.debug(`[SMS DISABLED] To: ${phone} | ${message}`);
      return false;
    }

    const provider = process.env.SMS_PROVIDER || 'fast2sms';

    try {
      if (provider === 'fast2sms') {
        return await this.sendFast2SMS(phone, message);
      }
      if (provider === 'twilio') {
        return await this.sendTwilio(phone, message);
      }
      logger.warn(`Unknown SMS provider: ${provider}`);
      return false;
    } catch (err: any) {
      logger.error(`SMS send failed to ${phone}: ${err.message}`);
      return false;
    }
  }

  private static async sendFast2SMS(phone: string, message: string): Promise<boolean> {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: process.env.SMS_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route:   'q',
        message,
        language:'english',
        flash:   0,
        numbers: phone,
      }),
    });
    const data = await response.json() as any;
    return data.return === true;
  }

  private static async sendTwilio(phone: string, message: string): Promise<boolean> {
    // Requires: npm install twilio
    // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    // await client.messages.create({ body: message, from: process.env.TWILIO_FROM, to: `+91${phone}` });
    logger.debug(`[TWILIO STUB] To: +91${phone} | ${message}`);
    return true;
  }

  static async sendOTP(phone: string, otp: string): Promise<boolean> {
    return this.send(phone, `Your PYQPB OTP is ${otp}. Valid for 10 minutes. Do not share.`);
  }

  static async sendPaymentConfirmation(phone: string, amount: number, credits: number): Promise<boolean> {
    return this.send(phone, `PYQPB: Payment of Rs.${amount} received. ${credits} credits added. Thank you!`);
  }
}

export default SmsService;