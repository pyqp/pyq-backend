import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Reads validation errors populated by express-validator chains.
 * Usage in routes: router.post('/', [validator1, validator2], validate, controller)
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  const formattedErrors = errors.array().map(err => ({
    field: err.type === 'field' ? (err as any).path : 'unknown',
    message: err.msg,
  }));

  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  });
};