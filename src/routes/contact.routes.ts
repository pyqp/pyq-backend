import { Router } from 'express';
import contactController from '../controllers/contact.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { contactLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Public — rate-limited
router.post('/', contactLimiter, contactController.submitContact);

// Admin
router.get('/',    protect, authorize('admin'), contactController.getAllTickets);
router.get('/:id', protect, authorize('admin'), contactController.getTicketById);
router.patch('/:id', protect, authorize('admin'), contactController.updateTicket);

export default router;