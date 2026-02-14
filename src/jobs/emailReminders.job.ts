import cron from 'node-cron';
import User from '../models/User.model';
import sendEmail from '../utils/sendEmail';
import logger from '../utils/logger';

/**
 * Runs daily at 9 AM — sends credit expiry email reminders.
 */
export const emailRemindersJob = cron.schedule('0 9 * * *', async () => {
  logger.info('[JOB] emailReminders: starting');
  const now      = new Date();
  const in7days  = new Date(now.getTime() + 7  * 86400000);
  const in30days = new Date(now.getTime() + 30 * 86400000);
  let sent = 0;

  try {
    const users = await User.find({ 'credits.total': { $gt: 0 }, isActive: true })
      .select('name email credits preferences');

    for (const user of users) {
      if (!user.preferences?.emailNotifications) continue;

      const expiringSoon = (user.credits.batches as any[]).filter(b =>
        b.status === 'active' &&
        new Date(b.expiryDate) <= in30days &&
        new Date(b.expiryDate) > now &&
        b.creditsRemaining > 0
      );

      if (!expiringSoon.length) continue;

      const urgent = expiringSoon.filter(b => new Date(b.expiryDate) <= in7days);
      const level  = urgent.length ? 'urgent' : 'warning';
      const totalExpiring = expiringSoon.reduce((s: number, b: any) => s + b.creditsRemaining, 0);

      await sendEmail({
        to:      user.email,
        subject: level === 'urgent'
          ? `⚠️ ${totalExpiring} credits expiring in 7 days!`
          : `📅 ${totalExpiring} credits expiring soon — use them!`,
        html: `
          <h2>Hi ${user.name},</h2>
          <p>You have <strong>${totalExpiring} credits</strong> expiring soon on PYQPB.</p>
          <ul>
            ${expiringSoon.map((b: any) => `
              <li><strong>${b.creditsRemaining} credits</strong> from "${b.packageName}" 
              expire on <strong>${new Date(b.expiryDate).toLocaleDateString('en-IN')}</strong></li>
            `).join('')}
          </ul>
          <p>Use your credits to take mock tests before they expire!</p>
          <a href="${process.env.FRONTEND_URL}/mock-tests" 
             style="background:#3182CE;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">
            Browse Mock Tests
          </a>
        `,
      });
      sent++;
    }

    logger.info(`[JOB] emailReminders: ${sent} reminder(s) sent`);
  } catch (err: any) {
    logger.error(`[JOB] emailReminders failed: ${err.message}`);
  }
}, { scheduled: false });

export default emailRemindersJob;