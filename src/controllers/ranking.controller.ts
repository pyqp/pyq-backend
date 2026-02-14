import { Response } from 'express';
import Ranking from '../models/Ranking.model';
import Result from '../models/Result.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Get leaderboard for a mock test
 * @route   GET /api/v1/rankings/:mockTestId/leaderboard
 * @access  Public
 */
export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mockTestId } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const rankings = await Ranking.find({ mockTest: mockTestId })
    .populate('user', 'name avatar')
    .sort('rank')
    .skip(skip)
    .limit(limitNum)
    .select('rank score percentage percentile timeTaken user lockedAt');

  const total = await Ranking.countDocuments({ mockTest: mockTestId });

  ApiResponse.paginated(res, rankings, pageNum, limitNum, total, 'Leaderboard fetched successfully');
});

/**
 * @desc    Get current user's rank for a mock test
 * @route   GET /api/v1/rankings/:mockTestId/my-rank
 * @access  Private
 */
export const getMyRank = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mockTestId } = req.params;
  const userId = req.user!._id;

  const ranking = await Ranking.findOne({ mockTest: mockTestId, user: userId })
    .populate('result', 'finalScore percentage accuracy timeTaken correct incorrect unattempted');

  if (!ranking) {
    throw new ApiError('You have not attempted this test yet', 404);
  }

  // Get neighbours (users ranked just above and below)
  const above = await Ranking.find({
    mockTest: mockTestId,
    rank:     { $lt: ranking.rank },
  })
    .populate('user', 'name avatar')
    .sort('-rank')
    .limit(3)
    .select('rank score percentage user');

  const below = await Ranking.find({
    mockTest: mockTestId,
    rank:     { $gt: ranking.rank },
  })
    .populate('user', 'name avatar')
    .sort('rank')
    .limit(3)
    .select('rank score percentage user');

  const totalParticipants = await Ranking.countDocuments({ mockTest: mockTestId });

  ApiResponse.success(res, {
    myRank:     ranking.rank,
    myScore:    ranking.score,
    percentage: ranking.percentage,
    percentile: ranking.percentile,
    timeTaken:  ranking.timeTaken,
    isLocked:   ranking.isLocked,
    lockedAt:   ranking.lockedAt,
    totalParticipants,
    neighbours: { above, below },
    result:     ranking.result,
  }, 'Rank fetched successfully');
});

/**
 * @desc    Get top 3 performers for a mock test
 * @route   GET /api/v1/rankings/:mockTestId/top3
 * @access  Public
 */
export const getTop3 = asyncHandler(async (req: AuthRequest, res: Response) => {
  const top3 = await Ranking.find({ mockTest: req.params.mockTestId })
    .populate('user', 'name avatar')
    .sort('rank')
    .limit(3)
    .select('rank score percentage percentile timeTaken user');

  ApiResponse.success(res, top3, 'Top 3 fetched successfully');
});

/**
 * @desc    Get ranking stats for a mock test
 * @route   GET /api/v1/rankings/:mockTestId/stats
 * @access  Public
 */
export const getRankingStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mockTestId } = req.params;

  const rankings = await Ranking.find({ mockTest: mockTestId }).select('score timeTaken');

  if (rankings.length === 0) {
    return ApiResponse.success(res, {
      totalParticipants: 0,
      averageScore:      0,
      topScore:          0,
      lowestScore:       0,
      top10Cutoff:       0,
      top25Cutoff:       0,
      medianScore:       0,
    }, 'No participants yet');
  }

  const scores     = rankings.map(r => r.score).sort((a, b) => b - a);
  const total      = scores.length;
  const average    = Math.round(scores.reduce((a, b) => a + b, 0) / total);
  const top10Idx   = Math.max(0, Math.ceil(total * 0.1) - 1);
  const top25Idx   = Math.max(0, Math.ceil(total * 0.25) - 1);
  const medianIdx  = Math.floor(total / 2);

  ApiResponse.success(res, {
    totalParticipants: total,
    averageScore:      average,
    topScore:          scores[0],
    lowestScore:       scores[total - 1],
    top10Cutoff:       scores[top10Idx],
    top25Cutoff:       scores[top25Idx],
    medianScore:       scores[medianIdx],
  }, 'Ranking stats fetched successfully');
});

/**
 * @desc    Get user's overall ranking history across all tests
 * @route   GET /api/v1/rankings/my-history
 * @access  Private
 */
export const getMyRankingHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const rankings = await Ranking.find({ user: req.user!._id })
    .populate('mockTest', 'name slug')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum)
    .select('rank score percentage percentile timeTaken mockTest lockedAt');

  const total = await Ranking.countDocuments({ user: req.user!._id });

  // Summary stats
  const allRankings = await Ranking.find({ user: req.user!._id }).select('rank score percentage percentile');
  const bestRank    = allRankings.length > 0 ? Math.min(...allRankings.map(r => r.rank))    : null;
  const avgScore    = allRankings.length > 0
    ? Math.round(allRankings.reduce((s, r) => s + r.score, 0) / allRankings.length)
    : 0;
  const avgPercentile = allRankings.length > 0
    ? Math.round(allRankings.reduce((s, r) => s + r.percentile, 0) / allRankings.length)
    : 0;

  ApiResponse.paginated(res, rankings, pageNum, limitNum, total, 'Ranking history fetched', {
    summary: { bestRank, avgScore, avgPercentile, totalTests: total },
  });
});

export default {
  getLeaderboard,
  getMyRank,
  getTop3,
  getRankingStats,
  getMyRankingHistory,
};