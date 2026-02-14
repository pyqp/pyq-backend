import { Response } from 'express';
import Referral from '../models/Referral.model';
import User from '../models/User.model';
import CreditTransaction from '../models/CreditTransaction.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

// Config — easy to move to env later
const REFERRAL_CREDITS_ON_SIGNUP    = 0;   // Credits to referrer on signup
const REFERRAL_CREDITS_ON_PURCHASE  = 1;   // Credits to referrer on first purchase
const BONUS_CREDITS_MILESTONE_10    = 3;   // Bonus after 10 referrals purchase
const BONUS_CREDITS_MILESTONE_50    = 15;  // Bonus after 50 referrals purchase

/**
 * @desc    Apply a referral code at registration (called internally)
 *          Exported for use in auth.controller
 */
export const applyReferralCode = async (
  newUserId: string,
  referralCode: string
): Promise<void> => {
  const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
  if (!referrer || referrer._id.toString() === newUserId) return;

  // Prevent duplicate referrals
  const existing = await Referral.findOne({ referrer: referrer._id, referred: newUserId });
  if (existing) return;

  await Referral.create({
    referrer:    referrer._id,
    referred:    newUserId,
    referralCode: referralCode.toUpperCase(),
    status:      'pending',
    signupDate:  new Date(),
    creditsAwarded: REFERRAL_CREDITS_ON_SIGNUP,
    bonusCreditsAwarded: 0,
    isFirstPurchase: false,
  });

  // Update referrer stats
  await User.findByIdAndUpdate(referrer._id, {
    $inc: { 'referralStats.totalReferred': 1 },
  });
};

/**
 * @desc    Complete referral on first purchase (called from payment.controller)
 */
export const completeReferralOnPurchase = async (
  referredUserId: string,
  purchaseAmount: number
): Promise<void> => {
  const referral = await Referral.findOne({
    referred: referredUserId,
    status:   'pending',
  });
  if (!referral) return;

  const referrer = await User.findById(referral.referrer);
  if (!referrer) return;

  // Mark referral completed
  referral.status          = 'completed';
  referral.purchaseDate    = new Date();
  referral.purchaseAmount  = purchaseAmount;
  referral.creditsAwarded  = REFERRAL_CREDITS_ON_PURCHASE;
  referral.isFirstPurchase = true;
  await referral.save();

  // Award credits to referrer
  const creditsBefore = referrer.credits.total;
  await referrer.addCredits(REFERRAL_CREDITS_ON_PURCHASE, 365, 'Referral Bonus');

  await CreditTransaction.create({
    user:          referrer._id,
    type:          'credit',
    amount:        REFERRAL_CREDITS_ON_PURCHASE,
    balanceBefore: creditsBefore,
    balanceAfter:  referrer.credits.total,
    source:        'referral',
    reference:     referral._id,
    referenceModel: 'Referral',
    description:   `Referral bonus — ${referral.referralCode}`,
    expiryDate:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });

  // Update referrer stats
  await User.findByIdAndUpdate(referrer._id, {
    $inc: {
      'referralStats.totalPurchased':  1,
      'referralStats.creditsEarned':   REFERRAL_CREDITS_ON_PURCHASE,
      'referralStats.totalValue':      purchaseAmount,
    },
    $set: { 'referralStats.lastReferralDate': new Date() },
  });

  // Check milestones
  const updatedReferrer = await User.findById(referral.referrer);
  if (!updatedReferrer) return;

  const totalPurchased = updatedReferrer.referralStats.totalPurchased;

  if (totalPurchased >= 10 && !updatedReferrer.referralStats.milestone10Claimed) {
    const cb10 = updatedReferrer.credits.total;
    await updatedReferrer.addCredits(BONUS_CREDITS_MILESTONE_10, 365, 'Milestone Bonus 10');
    await CreditTransaction.create({
      user:          updatedReferrer._id,
      type:          'credit',
      amount:        BONUS_CREDITS_MILESTONE_10,
      balanceBefore: cb10,
      balanceAfter:  updatedReferrer.credits.total,
      source:        'bonus',
      description:   '🎉 Milestone bonus — 10 referrals purchased!',
      expiryDate:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    await User.findByIdAndUpdate(updatedReferrer._id, {
      $set:  { 'referralStats.milestone10Claimed': true },
      $inc:  { 'referralStats.bonusCreditsEarned': BONUS_CREDITS_MILESTONE_10 },
    });
  }

  if (totalPurchased >= 50 && !updatedReferrer.referralStats.milestone50Claimed) {
    const cb50 = updatedReferrer.credits.total;
    await updatedReferrer.addCredits(BONUS_CREDITS_MILESTONE_50, 365, 'Milestone Bonus 50');
    await CreditTransaction.create({
      user:          updatedReferrer._id,
      type:          'credit',
      amount:        BONUS_CREDITS_MILESTONE_50,
      balanceBefore: cb50,
      balanceAfter:  updatedReferrer.credits.total,
      source:        'bonus',
      description:   '🏆 Milestone bonus — 50 referrals purchased!',
      expiryDate:    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    await User.findByIdAndUpdate(updatedReferrer._id, {
      $set: { 'referralStats.milestone50Claimed': true },
      $inc: { 'referralStats.bonusCreditsEarned': BONUS_CREDITS_MILESTONE_50 },
    });
  }
};

/**
 * @desc    Get my referral dashboard
 * @route   GET /api/v1/referrals/dashboard
 * @access  Private
 */
export const getReferralDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id)
    .select('referralCode referralStats credits');
  if (!user) throw new ApiError('User not found', 404);

  const recentReferrals = await Referral.find({ referrer: req.user!._id })
    .populate('referred', 'name createdAt')
    .sort('-createdAt')
    .limit(10)
    .select('status signupDate purchaseDate creditsAwarded isFirstPurchase');

  ApiResponse.success(res, {
    referralCode: user.referralCode,
    referralLink: `${process.env.FRONTEND_URL || 'https://pyqpb.com'}/register?ref=${user.referralCode}`,
    stats:        user.referralStats,
    recentReferrals,
    rewards: {
      perReferral:      `${REFERRAL_CREDITS_ON_PURCHASE} credit per purchase`,
      milestone10:      `${BONUS_CREDITS_MILESTONE_10} bonus credits at 10 referrals`,
      milestone50:      `${BONUS_CREDITS_MILESTONE_50} bonus credits at 50 referrals`,
      milestone10Done:  user.referralStats.milestone10Claimed,
      milestone50Done:  user.referralStats.milestone50Claimed,
    },
  }, 'Referral dashboard fetched successfully');
});

/**
 * @desc    Get full referral history
 * @route   GET /api/v1/referrals/history
 * @access  Private
 */
export const getReferralHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', status } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const query: any = { referrer: req.user!._id };
  if (status) query.status = status;

  const referrals = await Referral.find(query)
    .populate('referred', 'name email createdAt')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum);

  const total = await Referral.countDocuments(query);

  ApiResponse.paginated(res, referrals, pageNum, limitNum, total, 'Referral history fetched');
});

/**
 * @desc    Validate a referral code (used on signup page)
 * @route   GET /api/v1/referrals/validate/:code
 * @access  Public
 */
export const validateReferralCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = (req.params.code as string).toUpperCase();
  const user = await User.findOne({ referralCode: code }).select('name referralCode');

  if (!user) throw new ApiError('Invalid referral code', 404);

  ApiResponse.success(res, {
    valid:        true,
    referralCode: user.referralCode,
    referrerName: user.name,
    reward:       `Both you and your friend get a bonus when you make your first purchase!`,
  }, 'Referral code is valid');
});

export default {
  getReferralDashboard,
  getReferralHistory,
  validateReferralCode,
};