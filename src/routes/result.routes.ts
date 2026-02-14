import { Router } from 'express';
import resultController from '../controllers/result.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// ─── Protected (owner) ────────────────────────────────────────────────────────
router.get('/my-results',                      protect, resultController.getMyResults);
router.get('/:resultId',                       protect, resultController.getResultById);
router.get('/:resultId/analytics',             protect, resultController.getAnalytics);
router.get('/:resultId/scorecard',             protect, resultController.getScorecard);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get('/mock-test/:mockTestId', protect, authorize('admin'), resultController.getMockTestResults);

export default router;