import User from '../models/User.model';
import CreditTransaction from '../models/CreditTransaction.model';
import NotificationService from './notification.service';
import logger from '../utils/logger';

export class CreditService {
  static async addCredits(
    userId: string,
    amount: number,
    validityDays: number,
    packageName: string,
    source: 'purchase' | 'referral' | 'bonus' | 'admin',
    referenceId?: string
  ): Promise<number> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const before = user.credits.total;
    await user.addCredits(amount, validityDays, packageName);

    await CreditTransaction.create({
      user:          userId,
      type:          'credit',
      amount,
      balanceBefore: before,
      balanceAfter:  user.credits.total,
      source,
      reference:     referenceId,
      description:   `${amount} credits added (${source})`,
      expiryDate:    new Date(Date.now() + validityDays * 86400000),
    });

    return user.credits.total;
  }

  static async deductCredits(userId: string, amount: number, testAttemptId: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const before = user.credits.total;
    const success = await user.deductCredits(amount);
    if (!success) return false;

    await CreditTransaction.create({
      user:          userId,
      type:          'debit',
      amount,
      balanceBefore: before,
      balanceAfter:  user.credits.total,
      source:        'test_usage',
      reference:     testAttemptId,
      referenceModel:'TestAttempt',
      description:   `${amount} credit(s) used for test`,
    });

    return true;
  }

  static async getExpiringSoon(userId: string, days = 30): Promise<any[]> {
    const user = await User.findById(userId).select('credits');
    if (!user) return [];

    const cutoff = new Date(Date.now() + days * 86400000);
    return user.credits.batches.filter(
      (b: any) => b.status === 'active' && new Date(b.expiryDate) <= cutoff
    );
  }

  static async expireStaleBatches(userId: string): Promise<number> {
    const user = await User.findById(userId);
    if (!user) return 0;

    const now = new Date();
    let expired = 0;
    user.credits.batches.forEach((b: any) => {
      if (b.status === 'active' && new Date(b.expiryDate) < now) {
        b.status = 'expired';
        expired++;
      }
    });

    if (expired > 0) {
      user.credits.total = user.credits.batches
        .filter((b: any) => b.status === 'active')
        .reduce((s: number, b: any) => s + b.creditsRemaining, 0);
      await user.save();
      logger.info(`Expired ${expired} credit batch(es) for user ${userId}`);
    }

    return expired;
  }
}

export default CreditService;