import { Response } from 'express';
import CreditTransaction from '../models/CreditTransaction.model';
import User from '../models/User.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Get credit balance and active batches
 * @route   GET /api/v1/credits/balance
 * @access  Private
 */
export const getCreditBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).select('credits');
  if (!user) throw new ApiError('User not found', 404);

  const now = new Date();

  // Expire stale batches
  let updated = false;
  user.credits.batches.forEach((batch: any) => {
    if (batch.status === 'active' && batch.expiryDate < now) {
      batch.status = 'expired';
      updated = true;
    }
  });
  if (updated) {
    user.credits.total = user.credits.batches
      .filter((b: any) => b.status === 'active')
      .reduce((sum: number, b: any) => sum + b.creditsRemaining, 0);
    await user.save();
  }

  const activeBatches = user.credits.batches
    .filter((b: any) => b.status === 'active')
    .sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // Find soonest-expiring batch
  const soonestExpiry = activeBatches[0] ?? null;
  const expiringSoon  = activeBatches.filter((b: any) => {
    const days = (new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  });

  ApiResponse.success(res, {
    total:        user.credits.total,
    activeBatches,
    expiringSoon: {
      count:      expiringSoon.reduce((s: number, b: any) => s + b.creditsRemaining, 0),
      batches:    expiringSoon,
      nextExpiry: soonestExpiry?.expiryDate ?? null,
    },
    lastUpdated: user.credits.lastUpdated,
  }, 'Credit balance fetched successfully');
});

/**
 * @desc    Get credit transaction history
 * @route   GET /api/v1/credits/history
 * @access  Private
 */
export const getCreditHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', type } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const query: any = { user: req.user!._id };
  if (type) query.type = type;

  const transactions = await CreditTransaction.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum)
    .select('-__v');

  const total = await CreditTransaction.countDocuments(query);

  ApiResponse.paginated(res, transactions, pageNum, limitNum, total, 'Credit history fetched successfully');
});

/**
 * @desc    Get credit usage summary
 * @route   GET /api/v1/credits/summary
 * @access  Private
 */
export const getCreditSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;

  const [purchased, used, earned, expired] = await Promise.all([
    CreditTransaction.aggregate([
      { $match: { user: userId, source: 'purchase', type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    CreditTransaction.aggregate([
      { $match: { user: userId, source: 'test_usage', type: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    CreditTransaction.aggregate([
      { $match: { user: userId, source: { $in: ['referral', 'bonus'] }, type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    CreditTransaction.countDocuments({ user: userId, source: 'refund' }),
  ]);

  ApiResponse.success(res, {
    purchased: { total: purchased[0]?.total ?? 0, transactions: purchased[0]?.count ?? 0 },
    used:      { total: used[0]?.total ?? 0,      transactions: used[0]?.count ?? 0 },
    earned:    { total: earned[0]?.total ?? 0,     transactions: earned[0]?.count ?? 0 },
    refunds:   expired,
  }, 'Credit summary fetched successfully');
});

export default { getCreditBalance, getCreditHistory, getCreditSummary };