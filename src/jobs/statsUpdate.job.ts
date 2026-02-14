import cron from 'node-cron';
import User from '../models/User.model';
import Result from '../models/Result.model';
import logger from '../utils/logger';

/**
 * Runs daily at 3 AM — recalculates user stats from results.
 */
export const statsUpdateJob = cron.schedule('0 3 * * *', async () => {
  logger.info('[JOB] statsUpdate: starting');
  let updated = 0;

  try {
    const users = await User.find({ isActive: true }).select('_id stats').lean();

    for (const user of users) {
      const stats = await Result.aggregate([
        { $match: { user: user._id } },
        { $group: {
          _id:           null,
          totalTests:    { $sum: 1 },
          totalTime:     { $sum: '$timeTaken' },
          avgScore:      { $avg: '$percentage' },
          bestScore:     { $max: '$percentage' },
        }},
      ]);

      if (!stats[0]) continue;

      await User.findByIdAndUpdate(user._id, {
        'stats.totalTestsTaken': stats[0].totalTests,
        'stats.totalTimeSpent':  Math.round(stats[0].totalTime / 60),
        'stats.averageScore':    Math.round(stats[0].avgScore * 100) / 100,
        'stats.bestScore':       Math.round(stats[0].bestScore * 100) / 100,
      });
      updated++;
    }

    logger.info(`[JOB] statsUpdate: updated ${updated} user(s)`);
  } catch (err: any) {
    logger.error(`[JOB] statsUpdate failed: ${err.message}`);
  }
}, { scheduled: false });

export default statsUpdateJob;