import { Router } from 'express';
import userController from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { uploadAvatar } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', userController.updateProfile);

/**
 * @route   POST /api/v1/users/avatar
 * @desc    Upload user avatar (multipart/form-data, field: avatar)
 * @access  Private
 */
router.post('/avatar', uploadAvatar, userController.uploadAvatar);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', userController.updatePreferences);

/**
 * @route   GET /api/v1/users/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', userController.getDashboard);

/**
 * @route   GET /api/v1/users/test-history
 * @desc    Get user test history
 * @access  Private
 */
router.get('/test-history', userController.getTestHistory);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', userController.deleteAccount);

export default router;