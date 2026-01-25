// ==========================================
// ACHIEVEMENT CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { achievementService } from '../services/achievement.service';
import { authService } from '../services/auth.service';

// ==========================================
// HELPER: Get user from token
// ==========================================

async function getUserFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const user = await authService.validateToken(token);
  return user?.id || null;
}

// ==========================================
// GET /api/achievements - Lista conquistas do usuario
// ==========================================

export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const achievements = await achievementService.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error('[Achievement] Erro ao buscar conquistas:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET /api/achievements/title - Titulo ativo
// ==========================================

export const getActiveTitle = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const title = await achievementService.getActiveTitle(userId);
    res.json({ title });
  } catch (error) {
    console.error('[Achievement] Erro ao buscar titulo:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// PUT /api/achievements/title - Setar titulo ativo
// ==========================================

export const setActiveTitle = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { titleId } = req.body;
    const success = await achievementService.setActiveTitle(userId, titleId || null);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Titulo invalido' });
    }
  } catch (error) {
    console.error('[Achievement] Erro ao setar titulo:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET /api/achievements/titles - Todos os titulos do usuario
// ==========================================

export const getUserTitles = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const titles = await achievementService.getUserTitles(userId);
    res.json({ titles });
  } catch (error) {
    console.error('[Achievement] Erro ao buscar titulos:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET /api/achievements/game/:gameId/badges - Badges de um jogo
// ==========================================

export const getGameBadges = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { gameId } = req.params;
    const badges = await achievementService.getGameBadges(gameId);
    res.json({ badges });
  } catch (error) {
    console.error('[Achievement] Erro ao buscar badges:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};
