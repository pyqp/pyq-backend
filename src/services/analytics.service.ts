import Result from '../models/Result.model';
import User from '../models/User.model';
import Payment from '../models/Payment.model';
import MockTest from '../models/MockTest.model';

export class AnalyticsService {
  static async getUserPerformanceTrend(userId: string, limit = 10) {
    return Result.find({ user: userId })
      .sort('-createdAt')
      .limit(limit)
      .populate('mockTest', 'name difficulty')
      .select('finalScore percentage accuracy rank timeTaken createdAt mockTest')
      .lean();
  }

  static async getUserSubjectStrengths(userId: string) {
    const results = await Result.find({ user: userId }).select('subjectPerformance').lean();
    const subjectMap: Record<string, { total: number; correct: number; attempts: number }> = {};

    results.forEach((r: any) => {
      (r.subjectPerformance || []).forEach((s: any) => {
        if (!subjectMap[s.subject]) subjectMap[s.subject] = { total: 0, correct: 0, attempts: 0 };
        subjectMap[s.subject].total   += s.total   || 0;
        subjectMap[s.subject].correct += s.correct || 0;
        subjectMap[s.subject].attempts++;
      });
    });

    return Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      attempts: data.attempts,
      questionsAttempted: data.total,
    })).sort((a, b) => b.accuracy - a.accuracy);
  }

  static async getPlatformOverview() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [users, revenue, tests, results] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      MockTest.countDocuments({ isActive: true }),
      Result.countDocuments({ createdAt: { $gte: thisMonth } }),
    ]);

    return {
      totalUsers:          users,
      revenueThisMonth:    revenue[0]?.total ?? 0,
      activeMockTests:     tests,
      attemptsThisMonth:   results,
    };
  }

  static async getScoreDistribution(mockTestId: string) {
    const buckets = await Result.aggregate([
      { $match: { mockTest: mockTestId } },
      { $bucket: {
        groupBy: '$percentage',
        boundaries: [0, 20, 40, 60, 80, 101],
        default: 'Other',
        output: { count: { $sum: 1 }, avgTime: { $avg: '$timeTaken' } },
      }},
    ]);
    return buckets;
  }
}

export default AnalyticsService;