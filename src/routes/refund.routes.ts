import { Router } from 'express';
import refundController from '../controllers/refund.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/request',         protect, refundController.requestRefund);
router.get('/my-refunds',       protect, refundController.getMyRefunds);

router.get('/',                 protect, authorize('admin'), refundController.getAllRefunds);
router.patch('/:id/process',    protect, authorize('admin'), refundController.processRefund);

export default router;