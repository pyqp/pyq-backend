import { Router } from 'express';
import mockTestController from '../controllers/mockTest.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/',           mockTestController.getAllMockTests);
router.get('/:id',        mockTestController.getMockTestById);

// ─── Protected (logged-in users) ──────────────────────────────────────────────
router.post('/:id/start',      protect, mockTestController.startMockTest);
router.patch('/:id/save-answer', protect, mockTestController.saveAnswer);
router.post('/:id/submit',     protect, mockTestController.submitMockTest);
router.get('/:id/my-attempts', protect, mockTestController.getMyAttempts);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.post('/',    protect, authorize('admin'), mockTestController.createMockTest);
router.put('/:id',  protect, authorize('admin'), mockTestController.updateMockTest);
router.delete('/:id', protect, authorize('admin'), mockTestController.deleteMockTest);

export default router;