import { Router } from 'express';
import mockTestController from '../controllers/mockTest.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { cache } from '../middleware/cache.middleware';
import { testLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// ─── Public (cached) ──────────────────────────────────────────────────────────
router.get('/',    cache(180), mockTestController.getAllMockTests);
router.get('/:id', cache(300), mockTestController.getMockTestById);

// ─── Protected ────────────────────────────────────────────────────────────────
router.post('/:id/start',        protect, testLimiter, mockTestController.startMockTest);
router.patch('/:id/save-answer', protect,              mockTestController.saveAnswer);
router.post('/:id/submit',       protect,              mockTestController.submitMockTest);
router.get('/:id/my-attempts',   protect,              mockTestController.getMyAttempts);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.post('/',    protect, authorize('admin'), mockTestController.createMockTest);
router.put('/:id',  protect, authorize('admin'), mockTestController.updateMockTest);
router.delete('/:id', protect, authorize('admin'), mockTestController.deleteMockTest);

export default router;