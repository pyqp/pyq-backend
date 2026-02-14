import cron from 'node-cron';
import MockTest from '../models/MockTest.model';
import RankingService from '../services/ranking.service';
import logger from '../utils/logger';

/**
 * Runs every 15 minutes — recomputes rankings for recently active tests.
 */
export const rankingUpdateJob = cron.schedule('*/15 * * * *', async () => {
  logger.info('[JOB] rankingUpdate: starting');

  try {
    const since = new Date(Date.now() - 20 * 60000); // tests with attempts in last 20 min
    const activeTests = await MockTest.find({ isActive: true, updatedAt: { $gte: since } }).select('_id');

    let updated = 0;
    for (const test of activeTests) {
      await RankingService.recomputeAllRanks(test._id.toString());
      updated++;
    }

    logger.info(`[JOB] rankingUpdate: updated ${updated} test(s)`);
  } catch (err: any) {
    logger.error(`[JOB] rankingUpdate failed: ${err.message}`);
  }
}, { scheduled: false });

export default rankingUpdateJob;