import { Response } from 'express';
import User from '../models/User.model';
import Result from '../models/Result.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  ApiResponse.success(
    res,
    {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      referralCode: user.referralCode,
      credits: user.credits,
      loyaltyPoints: user.loyaltyPoints,
      referralStats: user.referralStats,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt,
    },
    'Profile fetched successfully'
  );
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, phone, dateOfBirth, avatar } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Update fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (avatar) user.avatar = avatar;

  await user.save();

  ApiResponse.success(
    res,
    {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      dateOfBirth: user.dateOfBirth,
    },
    'Profile updated successfully'
  );
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/v1/users/preferences
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { targetExams, language, emailNotifications, smsNotifications } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Update preferences
  if (targetExams !== undefined) user.preferences.targetExams = targetExams;
  if (language) user.preferences.language = language;
  if (emailNotifications !== undefined)
    user.preferences.emailNotifications = emailNotifications;
  if (smsNotifications !== undefined) user.preferences.smsNotifications = smsNotifications;

  await user.save();

  ApiResponse.success(res, user.preferences, 'Preferences updated successfully');
});

/**
 * @desc    Get user dashboard
 * @route   GET /api/v1/users/dashboard
 * @access  Private
 */
export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Calculate active credits
  const now = new Date();
  const activeCredits = user.credits.batches.filter(
    batch => batch.status === 'active' && new Date(batch.expiryDate) > now
  );

  // Calculate expiring soon (next 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringSoon = activeCredits.filter(
    batch => new Date(batch.expiryDate) <= sevenDaysFromNow
  );

  ApiResponse.success(
    res,
    {
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      credits: {
        total: user.credits.total,
        active: activeCredits.length,
        expiringSoon: expiringSoon.length,
        batches: activeCredits.map(batch => ({
          batchId: batch.batchId,
          packageName: batch.packageName,
          remaining: batch.creditsRemaining,
          expiryDate: batch.expiryDate,
        })),
      },
      loyaltyPoints: {
        total: user.loyaltyPoints.total,
        level: user.loyaltyPoints.level,
        levelName: user.loyaltyPoints.levelName,
        pointsToNextLevel: user.loyaltyPoints.pointsToNextLevel,
      },
      referrals: {
        totalReferred: user.referralStats.totalReferred,
        totalPurchased: user.referralStats.totalPurchased,
        creditsEarned: user.referralStats.creditsEarned,
        bonusCreditsEarned: user.referralStats.bonusCreditsEarned,
      },
      stats: user.stats,
    },
    'Dashboard data fetched successfully'
  );
});

/**
 * @desc    Get test history
 * @route   GET /api/v1/users/test-history
 * @access  Private
 */
export const getTestHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const results = await Result.find({ user: req.user!._id })
    .populate('mockTest', 'name slug difficulty exam')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum)
    .select('finalScore totalMarks percentage rank percentile accuracy timeTaken attemptNumber isFirstAttempt createdAt mockTest');

  const total = await Result.countDocuments({ user: req.user!._id });

  ApiResponse.paginated(res, results, pageNum, limitNum, total, 'Test history fetched successfully');
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/users/account
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError('Password is required to delete account', 400);
  }

  // Get user with password
  const user = await User.findById(req.user?._id).select('+password');
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid password', 401);
  }

  // Soft delete - deactivate account
  user.isActive = false;
  await user.save();

  // Clear cookies
  res.cookie('accessToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  ApiResponse.success(res, null, 'Account deleted successfully');
});

export default {
  getProfile,
  updateProfile,
  updatePreferences,
  getDashboard,
  getTestHistory,
  deleteAccount,
};