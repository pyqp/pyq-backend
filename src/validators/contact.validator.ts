import { body } from 'express-validator';

export const submitContactValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid Indian phone number'),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 5, max: 200 }).withMessage('Subject must be 5–200 characters'),

  body('category')
    .optional()
    .isIn(['general', 'payment', 'technical', 'exam', 'refund', 'feedback'])
    .withMessage('Invalid category'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Message must be 20–2000 characters'),
];

export const updateTicketValidator = [
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),

  body('adminNote')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Admin note must be under 1000 characters'),
];