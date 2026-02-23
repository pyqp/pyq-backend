import jwt, { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  id:    string;
  role?: string;
}

export const generateAccessToken = (userId: string, role: string): string =>
  jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as SignOptions
  );

export const generateRefreshToken = (userId: string): string =>
  jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' } as SignOptions
  );

export const verifyToken = (token: string, isRefreshToken = false): TokenPayload => {
  const secret = isRefreshToken
    ? (process.env.JWT_REFRESH_SECRET as string)
    : (process.env.JWT_SECRET       as string);
  return jwt.verify(token, secret) as TokenPayload;
};

/**
 * Build the user payload sent to the frontend.
 * Shape must match the `User` interface in frontend/src/api/auth.api.ts
 */
const buildUserPayload = (user: any) => ({
  _id:             user._id,
  name:            user.name,
  email:           user.email,
  phone:           user.phone,
  role:            user.role,
  avatar:          user.avatar,
  isEmailVerified: user.isEmailVerified,
  isActive:        user.isActive,
  referralCode:    user.referralCode,
  credits: {
    total:       user.credits?.total       ?? 0,
    batches:     user.credits?.batches     ?? [],
    lastUpdated: user.credits?.lastUpdated ?? new Date(),
  },
  loyaltyPoints: {
    total:             user.loyaltyPoints?.total             ?? 0,
    level:             user.loyaltyPoints?.level             ?? 'bronze',
    levelName:         user.loyaltyPoints?.levelName         ?? 'Bronze Member',
    pointsToNextLevel: user.loyaltyPoints?.pointsToNextLevel ?? 1000,
  },
  referralStats: {
    totalReferred: user.referralStats?.totalReferred ?? 0,
    creditsEarned: user.referralStats?.creditsEarned ?? 0,
  },
  stats: {
    totalTestsTaken: user.stats?.totalTestsTaken ?? 0,
    totalTimeSpent:  user.stats?.totalTimeSpent  ?? 0,
    averageScore:    user.stats?.averageScore    ?? 0,
    bestScore:       user.stats?.bestScore       ?? 0,
  },
  preferences: {
    targetExams:        user.preferences?.targetExams        ?? [],
    language:           user.preferences?.language           ?? 'english',
    emailNotifications: user.preferences?.emailNotifications ?? true,
    smsNotifications:   user.preferences?.smsNotifications   ?? false,
  },
  createdAt: user.createdAt,
});

/**
 * Set auth cookies and send JSON response.
 * Called from register, login, refreshToken controllers.
 */
export const sendTokenResponse = (user: any, statusCode: number, res: any) => {
  const accessToken  = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  const cookieExpire  = parseInt(process.env.JWT_COOKIE_EXPIRE || '7');
  const cookieOptions = {
    expires:  new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  res.cookie('accessToken',  accessToken,  cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.status(statusCode).json({
    success: true,
    data: {
      user:         buildUserPayload(user),
      accessToken,
      refreshToken,
    },
  });
};