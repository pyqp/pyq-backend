import { body, param } from 'express-validator';

export const saveAnswerValidator = [
  body('attemptId')
    .notEmpty().withMessage('Attempt ID is required')
    .isMongoId().withMessage('Invalid attempt ID'),

  body('questionNumber')
    .notEmpty().withMessage('Question number is required')
    .isInt({ min: 1 }).withMessage('Question number must be a positive integer'),

  body('userAnswer')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 5 }).withMessage('User answer must be between 0 and 5'),

  body('timeSpent')
    .notEmpty().withMessage('Time spent is required')
    .isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer'),

  body('markedForReview')
    .optional()
    .isBoolean().withMessage('markedForReview must be a boolean'),
];

export const submitTestValidator = [
  body('attemptId')
    .notEmpty().withMessage('Attempt ID is required')
    .isMongoId().withMessage('Invalid attempt ID'),

  body('timeTaken')
    .optional()
    .isInt({ min: 0 }).withMessage('timeTaken must be a non-negative integer'),
];

export const createMockTestValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Test name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Name must be 3–200 characters'),

  body('exam')
    .notEmpty().withMessage('Exam ID is required')
    .isMongoId().withMessage('Invalid exam ID'),

  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 5, max: 360 }).withMessage('Duration must be between 5 and 360 minutes'),

  body('totalQuestions')
    .notEmpty().withMessage('Total questions is required')
    .isInt({ min: 1, max: 200 }).withMessage('Total questions must be between 1 and 200'),

  body('difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(['easy', 'medium', 'hard', 'mixed']).withMessage('Invalid difficulty level'),

  body('isPaid')
    .optional()
    .isBoolean().withMessage('isPaid must be a boolean'),

  body('creditsRequired')
    .optional()
    .isInt({ min: 1 }).withMessage('Credits required must be at least 1'),
];