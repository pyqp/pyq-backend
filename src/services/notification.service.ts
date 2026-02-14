import Notification from '../models/Notification.model';
import logger from '../utils/logger';

type NotifType = 'info' | 'success' | 'warning' | 'error' | 'payment' | 'result' | 'credit' | 'referral';

export class NotificationService {
  static async send(
    userId: string,
    title: string,
    message: string,
    type: NotifType = 'info',
    link?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await Notification.create({ user: userId, title, message, type, link, metadata });
    } catch (err: any) {
      logger.error(`Notification creation failed: ${err.message}`);
    }
  }

  static async paymentSuccess(userId: string, amount: number, credits: number): Promise<void> {
    await this.send(
      userId,
      '🎉 Payment Successful!',
      `₹${amount} paid. ${credits} credits added to your account.`,
      'payment',
      '/dashboard'
    );
  }

  static async testResult(userId: string, testName: string, score: number, rank: number): Promise<void> {
    await this.send(
      userId,
      '📊 Your result is ready!',
      `${testName}: Score ${score}, Rank #${rank}`,
      'result',
      '/results'
    );
  }

  static async creditExpiry(userId: string, credits: number, daysLeft: number): Promise<void> {
    await this.send(
      userId,
      '⏰ Credits expiring soon',
      `${credits} credits will expire in ${daysLeft} days. Use them before they expire!`,
      'warning',
      '/dashboard'
    );
  }

  static async referralBonus(userId: string, credits: number): Promise<void> {
    await this.send(
      userId,
      '🎁 Referral bonus earned!',
      `You earned ${credits} credit(s) from a referral purchase.`,
      'referral',
      '/referrals'
    );
  }

  static async getUnread(userId: string): Promise<any[]> {
    return Notification.find({ user: userId, isRead: false })
      .sort('-createdAt')
      .limit(20)
      .lean();
  }

  static async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }
}

export default NotificationService;