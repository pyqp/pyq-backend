import cron from 'node-cron';
import TestAttempt from '../models/TestAttempt.model';
import Notification from '../models/Notification.model';
import logger from '../utils/logger';

/**
 * Runs daily at 4 AM — cleans up stale ongoing attempts and old notifications.
 */
export const cleanupJob = cron.schedule('0 4 * * *', async () => {
  logger.info('[JOB] cleanup: starting');

  try {
    // Abandon test attempts stuck in 'ongoing' for more than 24 hours
    const staleThreshold = new Date(Date.now() - 24 * 3600000);
    const stale = await TestAttempt.updateMany(
      { status: 'ongoing', startTime: { $lt: staleThreshold } },
      { status: 'submitted', endTime: new Date() }
    );
    logger.info(`[JOB] cleanup: ${stale.modifiedCount} stale attempt(s) closed`);

    // Delete notifications older than 90 days
    const notifThreshold = new Date(Date.now() - 90 * 86400000);
    const deleted = await Notification.deleteMany({ createdAt: { $lt: notifThreshold } });
    logger.info(`[JOB] cleanup: ${deleted.deletedCount} old notification(s) removed`);

  } catch (err: any) {
    logger.error(`[JOB] cleanup failed: ${err.message}`);
  }
}, { scheduled: false });

export default cleanupJob;