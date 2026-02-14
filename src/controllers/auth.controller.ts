import { Response } from 'express';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { sendTokenResponse } from '../utils/generateToken';
import emailService from '../services/email.service';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, phone, referralCode } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError('User with this email already exists', 400);
  }

  // Check referral code if provided
  let referredBy;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      throw new ApiError('Invalid referral code', 400);
    }
    referredBy = referrer._id;
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    referredBy,
  });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, name, verificationToken);
    logger.info(`Verification email sent to ${email}`);
  } catch (error: any) {
    logger.error(`Error sending verification email: ${error.message}`);
    // Continue registration even if email fails
  }

  // Send token response
  sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError('Invalid credentials', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError('Your account has been deactivated. Please contact support', 403);
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid credentials', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Send token response
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  // Clear cookies
  res.cookie('accessToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;

  ApiResponse.success(
    res,
    {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      avatar: user?.avatar,
      role: user?.role,
      isEmailVerified: user?.isEmailVerified,
      referralCode: user?.referralCode,
      credits: {
        total: user?.credits.total,
        batches: user?.credits.batches.filter(b => b.status === 'active'),
      },
      loyaltyPoints: user?.loyaltyPoints,
      referralStats: user?.referralStats,
      preferences: user?.preferences,
      stats: user?.stats,
      createdAt: user?.createdAt,
    },
    'User profile fetched successfully'
  );
});

/**
 * @desc    Verify email
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError('Verification token is required', 400);
  }

  // Hash token
  const hashedToken = createHash('sha256').update(token).digest('hex');

  // Find user with token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError('Invalid or expired verification token', 400);
  }

  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email, user.name);
  } catch (error: any) {
    logger.error(`Error sending welcome email: ${error.message}`);
  }

  ApiResponse.success(res, null, 'Email verified successfully', 200);
});

/**
 * @desc    Resend verification email
 * @route   POST /api/v1/auth/resend-verification
 * @access  Private
 */
export const resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (user.isEmailVerified) {
    throw new ApiError('Email is already verified', 400);
  }

  // Generate new token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

  ApiResponse.success(res, null, 'Verification email sent successfully');
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError('No user found with this email', 404);
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    ApiResponse.success(res, null, 'Password reset email sent');
  } catch (error: any) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    logger.error(`Error sending password reset email: ${error.message}`);
    throw new ApiError('Email could not be sent', 500);
  }
});

/**
 * @desc    Reset password
 * @route   PUT /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.params.token as string;
  const { password } = req.body;

  // Hash token
  const hashedToken = createHash('sha256').update(token).digest('hex');

  // Find user with token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError('Invalid or expired reset token', 400);
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  // Send token response (auto login)
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user?._id).select('+password');
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ApiError('Current password is incorrect', 401);
  }

  // Set new password
  user.password = newPassword;
  await user.save();

  // Send token response
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { id: string };

    // Get user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError('Invalid refresh token', 401);
    }

    // Send new tokens
    sendTokenResponse(user, 200, res);
  } catch (error) {
    throw new ApiError('Invalid or expired refresh token', 401);
  }
});

export default {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
};