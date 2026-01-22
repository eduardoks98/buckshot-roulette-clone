// ==========================================
// LEADERBOARD ROUTES
// ==========================================

import { Router } from 'express';
import { getLeaderboard, getMyRank } from '../controllers/leaderboard.controller';

const router = Router();

// Get leaderboard
router.get('/', getLeaderboard);

// Get my rank
router.get('/me', getMyRank);

export default router;
