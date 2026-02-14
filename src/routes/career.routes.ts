import { Router } from 'express';
import careerController from '../controllers/career.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { cache } from '../middleware/cache.middleware';

const router = Router();

router.get('/',          cache(1800), careerController.getOpenPositions);
router.get('/:slug',     cache(1800), careerController.getPositionBySlug);

router.post('/',         protect, authorize('admin'), careerController.createPosition);
router.put('/:id',       protect, authorize('admin'), careerController.updatePosition);
router.patch('/:id/close', protect, authorize('admin'), careerController.closePosition);

export default router;