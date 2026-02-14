import { body, param, query } from 'express-validator';

export const mongoIdParam = (field = 'id') =>
  param(field).isMongoId().withMessage(`Invalid ${field}`);

export const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export const mongoIdBody = (field: string) =>
  body(field).isMongoId().withMessage(`${field} must be a valid ID`);

export const requiredString = (field: string, min = 1, max = 500) =>
  body(field)
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ min, max }).withMessage(`${field} must be between ${min} and ${max} characters`);

export const optionalString = (field: string, max = 500) =>
  body(field).optional().trim().isLength({ max }).withMessage(`${field} must be under ${max} characters`);

export const requiredNumber = (field: string, min?: number, max?: number) => {
  let chain = body(field).notEmpty().withMessage(`${field} is required`).isNumeric().withMessage(`${field} must be a number`);
  if (min !== undefined) chain = chain.isFloat({ min }).withMessage(`${field} must be at least ${min}`);
  if (max !== undefined) chain = chain.isFloat({ max }).withMessage(`${field} must be at most ${max}`);
  return chain;
};