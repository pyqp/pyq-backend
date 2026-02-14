import { Router } from 'express';
import pyqController from '../controllers/pyq.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { cache } from '../middleware/cache.middleware';

const router = Router();

router.get('/',                        cache(300), pyqController.getAllPYQs);
router.get('/exam/:examId',            cache(300), pyqController.getPYQsByExam);
router.get('/:id',                     cache(600), pyqController.getPYQById);

router.post('/',    protect, authorize('admin'), pyqController.createPYQ);
router.put('/:id',  protect, authorize('admin'), pyqController.updatePYQ);
router.delete('/:id', protect, authorize('admin'), pyqController.deletePYQ);

export default router;