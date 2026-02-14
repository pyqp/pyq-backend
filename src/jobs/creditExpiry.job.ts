import cron from 'node-cron';
import User from '../models/User.model';
import CreditTransaction from '../models/CreditTransaction.model';
import NotificationService from '../services/notification.service';
import logger from '../utils/logger';

/**
 * Runs daily at 2 AM — expires stale credit batches and warns users.
 */
export const creditExpiryJob = cron.schedule('0 2 * * *', async () => {
  logger.info('[JOB] creditExpiry: starting');
  const now        = new Date();
  const in30days   = new Date(now.getTime() + 30 * 86400000);
  let expired = 0, warned = 0;

  try {
    const users = await User.find({ 'credits.total': { $gt: 0 } }).select('credits name email');

    for (const user of users) {
      let changed = false;

      for (const batch of user.credits.batches as any[]) {
        if (batch.status !== 'active') continue;

        // Expire
        if (new Date(batch.expiryDate) < now) {
          const before = user.credits.total;
          batch.status = 'expired';
          user.credits.total = Math.max(0, user.credits.total - batch.creditsRemaining);
          changed = true;
          expired++;
          await CreditTransaction.create({
            user: user._id, type: 'debit',
            amount: batch.creditsRemaining,
            balanceBefore: before, balanceAfter: user.credits.total,
            source: 'purchase', description: `Credits expired (batch ${batch.batchId})`,
          });
          await NotificationService.creditExpiry(user._id.toString(), batch.creditsRemaining, 0);
        }
        // Warn — expiring in ≤30 days
        else if (new Date(batch.expiryDate) <= in30days && batch.creditsRemaining > 0) {
          const daysLeft = Math.ceil((new Date(batch.expiryDate).getTime() - now.getTime()) / 86400000);
          await NotificationService.creditExpiry(user._id.toString(), batch.creditsRemaining, daysLeft);
          warned++;
        }
      }

      if (changed) await user.save();
    }

    logger.info(`[JOB] creditExpiry: ${expired} batches expired, ${warned} warnings sent`);
  } catch (err: any) {
    logger.error(`[JOB] creditExpiry failed: ${err.message}`);
  }
}, { scheduled: false });

export default creditExpiryJob;