import { Router } from 'express';
import rankingController from '../controllers/ranking.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/:mockTestId/leaderboard', rankingController.getLeaderboard);
router.get('/:mockTestId/top3',        rankingController.getTop3);
router.get('/:mockTestId/stats',       rankingController.getRankingStats);

// ─── Protected ────────────────────────────────────────────────────────────────
router.get('/my-history',              protect, rankingController.getMyRankingHistory);
router.get('/:mockTestId/my-rank',     protect, rankingController.getMyRank);

export default router;