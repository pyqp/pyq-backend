import { Router } from 'express';
import packageController from '../controllers/package.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { cache } from '../middleware/cache.middleware';

const router = Router();

// ─── Public (cached — packages rarely change) ─────────────────────────────────
router.get('/',             cache(900), packageController.getAllPackages);
router.get('/popular',      cache(900), packageController.getPopularPackage);
router.get('/compare',      cache(900), packageController.comparePackages);
router.get('/name/:name',   cache(900), packageController.getPackageByName);
router.get('/:id',          cache(900), packageController.getPackageById);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.post('/',    protect, authorize('admin'), packageController.createPackage);
router.put('/:id',  protect, authorize('admin'), packageController.updatePackage);
router.delete('/:id', protect, authorize('admin'), packageController.deletePackage);

export default router;