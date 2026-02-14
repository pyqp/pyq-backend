import { body } from 'express-validator';

/**
 * Update profile validation
 */
export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 10 || age > 100) {
        throw new Error('Age must be between 10 and 100');
      }
      return true;
    }),

  body('avatar')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL for avatar'),
];

/**
 * Update preferences validation
 */
export const updatePreferencesValidator = [
  body('targetExams')
    .optional()
    .isArray()
    .withMessage('Target exams must be an array'),

  body('language')
    .optional()
    .isIn(['english', 'hindi'])
    .withMessage('Language must be either english or hindi'),

  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),

  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications must be a boolean'),
];

/**
 * Delete account validation
 */
export const deleteAccountValidator = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account'),
];