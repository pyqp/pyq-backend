import { body } from 'express-validator';

export const createOrderValidator = [
  body('packageId')
    .notEmpty().withMessage('Package ID is required')
    .isMongoId().withMessage('Invalid package ID'),

  body('offerCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Offer code must be 3–20 characters')
    .matches(/^[A-Z0-9]+$/).withMessage('Offer code must be uppercase letters and numbers only'),
];

export const verifyPaymentValidator = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isString().withMessage('Order ID must be a string'),

  body('paymentId')
    .notEmpty().withMessage('Payment ID is required')
    .isString().withMessage('Payment ID must be a string'),

  body('signature')
    .notEmpty().withMessage('Signature is required')
    .isString().withMessage('Signature must be a string'),
];

export const refundRequestValidator = [
  body('paymentId')
    .notEmpty().withMessage('Payment ID is required')
    .isMongoId().withMessage('Invalid payment ID'),

  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be 10–500 characters'),

  body('amount')
    .optional()
    .isFloat({ min: 1 }).withMessage('Refund amount must be at least ₹1'),
];