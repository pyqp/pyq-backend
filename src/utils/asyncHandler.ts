import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to catch errors and pass to error middleware
 * Usage: asyncHandler(async (req, res, next) => { ... })
 */
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;