import { Router } from 'express';
import packageController from '../controllers/package.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Public routes
 */
router.get('/', packageController.getAllPackages);
router.get('/popular', packageController.getPopularPackage);
router.get('/compare', packageController.comparePackages);
router.get('/name/:name', packageController.getPackageByName);
router.get('/:id', packageController.getPackageById);

/**
 * Admin routes
 */
router.post('/', protect, authorize('admin'), packageController.createPackage);
router.put('/:id', protect, authorize('admin'), packageController.updatePackage);
router.delete('/:id', protect, authorize('admin'), packageController.deletePackage);

export default router;