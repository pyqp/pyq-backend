import { Router } from 'express';
import creditController from '../controllers/credit.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All credit routes are private
router.get('/balance', protect, creditController.getCreditBalance);
router.get('/history', protect, creditController.getCreditHistory);
router.get('/summary', protect, creditController.getCreditSummary);

export default router;