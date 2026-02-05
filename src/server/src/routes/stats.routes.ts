// ==========================================
// STATS ROUTES
// ==========================================

import { Router, Request, Response } from 'express';
import { statsService } from '../services/stats.service';

const router = Router();

/**
 * GET /api/stats/:userId
 * Buscar estatisticas de um usuario com progresso calculado
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'userId e obrigatorio' });
      return;
    }

    const statsResponse = await statsService.getUserStatsWithProgress(userId);
    res.json(statsResponse);
  } catch (error) {
    console.error('[Stats Route] Error fetching stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatisticas' });
  }
});

/**
 * GET /api/stats/od/:odUserId
 * Buscar estatisticas por odUserId (ID do portal)
 */
router.get('/od/:odUserId', async (req: Request, res: Response) => {
  try {
    const { odUserId } = req.params;

    if (!odUserId) {
      res.status(400).json({ error: 'odUserId e obrigatorio' });
      return;
    }

    const statsResponse = await statsService.getUserStatsByOdUserId(odUserId);

    if (!statsResponse) {
      res.status(404).json({ error: 'Usuario nao encontrado' });
      return;
    }

    res.json(statsResponse);
  } catch (error) {
    console.error('[Stats Route] Error fetching stats by odUserId:', error);
    res.status(500).json({ error: 'Erro ao buscar estatisticas' });
  }
});

export default router;
