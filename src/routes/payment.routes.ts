import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/create-order', protect, paymentLimiter, paymentController.createOrder);
router.post('/verify',       protect, paymentLimiter, paymentController.verifyPayment);
router.get('/history',       protect,                 paymentController.getPaymentHistory);
router.get('/:id',           protect,                 paymentController.getPaymentById);
router.post('/webhook',                               paymentController.handleWebhook);

export default router;