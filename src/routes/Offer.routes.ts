import { Router } from 'express';
import offerController from '../controllers/Offer.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/',          offerController.getActiveOffers);
router.get('/:code',     offerController.getOfferByCode);

// Private
router.post('/validate', protect, offerController.validateOffer);

// Admin
router.post('/',         protect, authorize('admin'), offerController.createOffer);
router.put('/:id',       protect, authorize('admin'), offerController.updateOffer);
router.delete('/:id',    protect, authorize('admin'), offerController.deleteOffer);

export default router;