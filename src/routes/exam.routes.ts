import { Router } from 'express';
import examController from '../controllers/exam.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Public routes
 */
router.get('/', examController.getAllExams);
router.get('/popular', examController.getPopularExams);
router.get('/categories/list', examController.getCategories);
router.get('/search', examController.searchExams);
router.get('/category/:category', examController.getExamsByCategory);
router.get('/slug/:slug', examController.getExamBySlug);
router.get('/:id', examController.getExamById);

/**
 * Admin routes
 */
router.post('/', protect, authorize('admin'), examController.createExam);
router.put('/:id', protect, authorize('admin'), examController.updateExam);
router.delete('/:id', protect, authorize('admin'), examController.deleteExam);

export default router;