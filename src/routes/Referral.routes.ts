import { Router } from 'express';
import referralController from '../controllers/Referral.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/validate/:code', referralController.validateReferralCode);

// Private
router.get('/dashboard', protect, referralController.getReferralDashboard);
router.get('/history',   protect, referralController.getReferralHistory);

export default router;