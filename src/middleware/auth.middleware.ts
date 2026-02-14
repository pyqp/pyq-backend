import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * Protect routes - Verify JWT token
 */
export const protect = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // Check if token exists
  if (!token) {
    throw new ApiError('Not authorized to access this route', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.isActive) {
      throw new ApiError('Your account has been deactivated', 403);
    }

    // Attach user to request
    req.user = user as any;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError('Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError('Token expired', 401);
    }
    throw new ApiError('Not authorized to access this route', 401);
  }
});

/**
 * Check if email is verified
 */
export const verifyEmail = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user?.isEmailVerified) {
      throw new ApiError('Please verify your email to access this resource', 403);
    }
    next();
  }
);

/**
 * Authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError('Not authorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }

    next();
  };
};

/**
 * Optional auth - Attach user if token exists but don't require it
 */
export const optionalAuth = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
          id: string;
        };
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive) {
          req.user = user as any;
        }
      } catch (error) {
        // Continue without user if token is invalid
      }
    }

    next();
  }
);