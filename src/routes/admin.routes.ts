import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/users',   adminController.getUserAnalytics);
router.get('/analytics/tests',   adminController.getTestAnalytics);

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users',                        adminController.listUsers);
router.get('/users/:id',                    adminController.getUserDetails);
router.patch('/users/:id/toggle-status',    adminController.toggleUserStatus);  // ✅ PATCH
router.post('/users/:id/grant-credits',     adminController.grantCredits);      // ✅ POST

// ─── Question Management ──────────────────────────────────────────────────────
router.get('/questions',              adminController.listQuestions);
router.get('/questions/stats',        adminController.getQuestionStats);
router.post('/questions/bulk',        adminController.bulkUploadQuestions);
router.delete('/questions/:id',       adminController.deleteQuestion);

export default router;