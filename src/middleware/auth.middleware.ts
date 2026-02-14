import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * Protect routes - Verify JWT token
 */
export const protect: RequestHandler = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError('Not authorized to access this route', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.isActive) {
      throw new ApiError('Your account has been deactivated', 403);
    }

    (req as AuthRequest).user = user as any;
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
export const verifyEmail: RequestHandler = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!(req as AuthRequest).user?.isEmailVerified) {
      throw new ApiError('Please verify your email to access this resource', 403);
    }
    next();
  }
);

/**
 * Authorize specific roles
 */
export const authorize = (...roles: string[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      throw new ApiError('Not authorized', 401);
    }

    if (!roles.includes(user.role)) {
      throw new ApiError(
        `User role '${user.role}' is not authorized to access this route`,
        403
      );
    }

    next();
  };
};

/**
 * Optional auth - Attach user if token exists but don't require it
 */
export const optionalAuth: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if ((req as any).cookies?.accessToken) {
      token = (req as any).cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive) {
          (req as AuthRequest).user = user as any;
        }
      } catch {
        // Continue without user if token is invalid
      }
    }

    next();
  }
);