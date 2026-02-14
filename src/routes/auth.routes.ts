import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerValidator, loginValidator, forgotPasswordValidator,
  resetPasswordValidator, changePasswordValidator,
} from '../validators/auth.validator';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.post('/register',       authLimiter, registerValidator, validate, authController.register);
router.post('/login',          authLimiter, loginValidator,    validate, authController.login);
router.post('/logout',         protect,                                   authController.logout);
router.post('/refresh-token',  authLimiter,                               authController.refreshToken);
router.get('/me',              protect,                                   authController.getMe);
router.post('/verify-email',   otpLimiter,                               authController.verifyEmail);
router.post('/resend-verification', otpLimiter,                          authController.resendVerification);
router.post('/forgot-password', otpLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.put('/change-password',  protect, changePasswordValidator, validate, authController.changePassword);

export default router;
