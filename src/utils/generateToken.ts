import jwt, { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role?: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as SignOptions
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' } as SignOptions
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string, isRefreshToken = false): TokenPayload => {
  const secret = isRefreshToken
    ? (process.env.JWT_REFRESH_SECRET as string)
    : (process.env.JWT_SECRET as string);
  
  return jwt.verify(token, secret) as TokenPayload;
};

/**
 * Send token response (set cookie & send JSON)
 */
export const sendTokenResponse = (user: any, statusCode: number, res: any) => {
  // Generate tokens
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();
  
  // Cookie options
  const cookieExpire = parseInt(process.env.JWT_COOKIE_EXPIRE || '7');
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };
  
  // Set cookies
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
  
  // Send response
  res.status(statusCode).json({
    success: true,
    message: 'Authentication successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        credits: user.credits.total,
        loyaltyPoints: user.loyaltyPoints.total,
      },
      accessToken,
      refreshToken,
    },
  });
};