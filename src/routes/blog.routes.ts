import { Router } from 'express';
import blogController from '../controllers/blog.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { cache } from '../middleware/cache.middleware';

const router = Router();

router.get('/',          cache(300), blogController.getAllPosts);
router.get('/:slug',     cache(600), blogController.getPostBySlug);

router.post('/',         protect, authorize('admin'), blogController.createPost);
router.put('/:id',       protect, authorize('admin'), blogController.updatePost);
router.delete('/:id',    protect, authorize('admin'), blogController.deletePost);

export default router;