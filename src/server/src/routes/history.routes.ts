// ==========================================
// HISTORY ROUTES
// ==========================================

import { Router } from 'express';
import {
  getUserHistory,
  getUserStats,
  getGameDetails,
} from '../controllers/history.controller';

const router = Router();

// Histórico de partidas
router.get('/', getUserHistory);

// Estatísticas resumidas
router.get('/stats', getUserStats);

// Detalhes de uma partida específica
router.get('/:gameId', getGameDetails);

export default router;
