// ==========================================
// LEADERBOARD CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { leaderboardService } from '../services/leaderboard.service';
import { authService } from '../services/auth.service';

// ==========================================
// GET LEADERBOARD
// ==========================================

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'weekly';
    const limit = parseInt(req.query.limit as string) || 100;

    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'all_time'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Periodo invalido' });
    }

    // Get user ID from token if provided
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await authService.validateToken(token);
      userId = user?.id;
    }

    const { entries, myRank } = await leaderboardService.getLeaderboard(
      period as 'daily' | 'weekly' | 'monthly' | 'all_time',
      limit,
      userId
    );

    res.json({ entries, myRank });
  } catch (error) {
    console.error('[Leaderboard] Erro ao obter leaderboard:', error instanceof Error ? error.message : error);
    console.error('[Leaderboard] Stack:', error instanceof Error ? error.stack : '');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==========================================
// GET MY RANK
// ==========================================

export const getMyRank = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.validateToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Token invalido' });
    }

    const period = (req.query.period as string) || 'all_time';
    const validPeriods = ['daily', 'weekly', 'monthly', 'all_time'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Periodo invalido' });
    }

    const { myRank } = await leaderboardService.getLeaderboard(
      period as 'daily' | 'weekly' | 'monthly' | 'all_time',
      1,
      user.id
    );

    res.json({ rank: myRank });
  } catch (error) {
    console.error('[Leaderboard] Erro ao obter rank:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};
