import Ranking from '../models/Ranking.model';
import Result from '../models/Result.model';
import logger from '../utils/logger';

export class RankingService {
  static async recomputeAllRanks(mockTestId: string): Promise<void> {
    const rankings = await Ranking.find({ mockTest: mockTestId }).sort('-score timeTaken');

    const updates = rankings.map((r, i) => ({
      updateOne: {
        filter: { _id: r._id },
        update: {
          rank:       i + 1,
          percentile: Math.round(((rankings.length - i) / rankings.length) * 10000) / 100,
          totalParticipants: rankings.length,
        },
      },
    }));

    if (updates.length > 0) {
      await Ranking.bulkWrite(updates);
      logger.debug(`Recomputed ${updates.length} ranks for mockTest ${mockTestId}`);
    }
  }

  static async getLeaderboard(mockTestId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rankings, total] = await Promise.all([
      Ranking.find({ mockTest: mockTestId })
        .sort('rank')
        .skip(skip)
        .limit(limit)
        .populate('user', 'name avatar')
        .lean(),
      Ranking.countDocuments({ mockTest: mockTestId }),
    ]);
    return { rankings, total };
  }

  static async getUserRank(mockTestId: string, userId: string) {
    const myRank = await Ranking.findOne({ mockTest: mockTestId, user: userId })
      .populate('user', 'name avatar');

    if (!myRank) return null;

    const [above, below] = await Promise.all([
      Ranking.find({ mockTest: mockTestId, rank: { $lt: myRank.rank, $gte: myRank.rank - 3 } })
        .sort('-rank').limit(3).populate('user', 'name avatar').lean(),
      Ranking.find({ mockTest: mockTestId, rank: { $gt: myRank.rank, $lte: myRank.rank + 3 } })
        .sort('rank').limit(3).populate('user', 'name avatar').lean(),
    ]);

    return { myRank, above, below };
  }

  static async getStats(mockTestId: string) {
    const stats = await Result.aggregate([
      { $match: { mockTest: mockTestId } },
      { $group: {
        _id:       null,
        avg:       { $avg: '$percentage' },
        max:       { $max: '$percentage' },
        count:     { $sum: 1 },
        scores:    { $push: '$percentage' },
      }},
    ]);

    if (!stats[0]) return null;

    const sorted = stats[0].scores.sort((a: number, b: number) => b - a);
    const top10  = sorted[Math.floor(sorted.length * 0.10)] ?? 0;
    const median = sorted[Math.floor(sorted.length * 0.50)] ?? 0;

    return {
      totalParticipants: stats[0].count,
      averageScore:      Math.round(stats[0].avg * 100) / 100,
      topScore:          stats[0].max,
      top10Cutoff:       Math.round(top10 * 100) / 100,
      medianScore:       Math.round(median * 100) / 100,
    };
  }
}

export default RankingService;