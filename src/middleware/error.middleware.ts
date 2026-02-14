import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

interface ErrorResponse {
  success: false;
  message: string;
  stack?: string;
  errors?: any;
}

/**
 * Global error handling middleware
 * Must be placed after all routes
 */
const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ApiError(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ApiError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(', ');
    error = new ApiError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again';
    error = new ApiError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please login again';
    error = new ApiError(message, 401);
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    message: error.message || 'Server Error',
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send response
  res.status(error.statusCode || 500).json(errorResponse);
};

/**
 * Handle 404 - Route not found
 */
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ApiError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

export default errorHandler;