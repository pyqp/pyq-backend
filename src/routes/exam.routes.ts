import { Router } from 'express';
import examController from '../controllers/exam.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { cache } from '../middleware/cache.middleware';

const router = Router();

// ─── Public (cached) ──────────────────────────────────────────────────────────
router.get('/',                  cache(300),  examController.getAllExams);
router.get('/popular',           cache(600),  examController.getPopularExams);
router.get('/categories/list',   cache(3600), examController.getCategories);
router.get('/search',            cache(120),  examController.searchExams);
router.get('/category/:category', cache(300), examController.getExamsByCategory);
router.get('/slug/:slug',                     examController.getExamBySlug);
router.get('/:id',               cache(600),  examController.getExamById);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.post('/',    protect, authorize('admin'), examController.createExam);
router.put('/:id',  protect, authorize('admin'), examController.updateExam);
router.delete('/:id', protect, authorize('admin'), examController.deleteExam);

export default router;