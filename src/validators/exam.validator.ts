import { body, param } from 'express-validator';

const VALID_CATEGORIES = [
  'SSC', 'Railway', 'UPSC', 'Banking', 'Defence',
  'State PSC', 'Teaching', 'Police', 'Engineering',
  'Medical', 'Law', 'MBA', 'University', 'Other',
];

/**
 * Create exam validation
 */
export const createExamValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Exam name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Exam name must be between 2 and 200 characters'),

  body('shortName')
    .trim()
    .notEmpty()
    .withMessage('Short name is required')
    .isLength({ max: 20 })
    .withMessage('Short name cannot exceed 20 characters'),

  body('category')
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('conductedBy')
    .trim()
    .notEmpty()
    .withMessage('Conducting authority is required'),

  body('examPattern.totalMarks')
    .isInt({ min: 1 })
    .withMessage('Total marks must be at least 1'),

  body('examPattern.duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),

  body('examPattern.totalQuestions')
    .isInt({ min: 1 })
    .withMessage('Total questions must be at least 1'),

  body('eligibility.qualification')
    .trim()
    .notEmpty()
    .withMessage('Minimum qualification is required'),

  body('examLevel')
    .optional()
    .isIn(['national', 'state', 'university', 'other'])
    .withMessage('Invalid exam level'),

  body('examMode')
    .optional()
    .isIn(['online', 'offline', 'both'])
    .withMessage('Invalid exam mode'),

  body('frequency')
    .optional()
    .isIn(['yearly', 'half-yearly', 'quarterly', 'monthly'])
    .withMessage('Invalid frequency'),

  body('officialWebsite')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
];

/**
 * Update exam validation
 */
export const updateExamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid exam ID'),

  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),

  body('examLevel')
    .optional()
    .isIn(['national', 'state', 'university', 'other'])
    .withMessage('Invalid exam level'),

  body('examMode')
    .optional()
    .isIn(['online', 'offline', 'both'])
    .withMessage('Invalid exam mode'),

  body('officialWebsite')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
];

/**
 * Validate Mongo ID param
 */
export const mongoIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];