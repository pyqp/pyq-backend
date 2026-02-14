import { Request, Response, NextFunction, RequestHandler } from 'express';
import ApiError from '../utils/ApiError';
import { AuthRequest } from '../types';

/** Ensure user is admin — lightweight alternative to authorize('admin') */
export const adminOnly: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'admin') {
    throw new ApiError('Admin access required', 403);
  }
  next();
};

/** Log all admin actions */
export const adminAudit: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  const ts   = new Date().toISOString();
  console.log(`[ADMIN AUDIT] ${ts} | ${user?.name} (${user?._id}) | ${req.method} ${req.originalUrl}`);
  next();
};