// import { Router } from 'express';
// import resultController from '../controllers/result.controller';
// import { protect, authorize } from '../middleware/auth.middleware';

// const router = Router();

// // ─── Protected (owner) ────────────────────────────────────────────────────────
// router.get('/my-results',                      protect, resultController.getMyResults);
// router.get('/:resultId',                       protect, resultController.getResultById);
// router.get('/:resultId/analytics',             protect, resultController.getAnalytics);
// router.get('/:resultId/scorecard',             protect, resultController.getScorecard);

// // ─── Admin ────────────────────────────────────────────────────────────────────
// router.get('/mock-test/:mockTestId', protect, authorize('admin'), resultController.getMockTestResults);

// export default router;


import { Router } from 'express';
import resultController from '../controllers/result.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// ── Named routes FIRST — must precede /:resultId wildcard ────────────────────
// Without this order, Express matches "my-results" as a MongoDB ObjectId string
// and throws a CastError before the controller even runs.
router.get('/my-results',            protect, resultController.getMyResults);
router.get('/mock-test/:mockTestId', protect, authorize('admin'), resultController.getMockTestResults);

// ── ID-scoped routes ─────────────────────────────────────────────────────────
router.get('/:resultId/analytics',   protect, resultController.getAnalytics);
router.get('/:resultId/scorecard',   protect, resultController.getScorecard);
router.get('/:resultId',             protect, resultController.getResultById);

export default router;