// ==========================================
// HISTORY CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { historyService } from '../services/history.service';
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
// GET /api/history - Lista histórico do usuário
// ==========================================

export const getUserHistory = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Limitar para evitar abusos
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);

    const result = await historyService.getUserHistory(userId, safePage, safeLimit);

    res.json(result);
  } catch (error) {
    console.error('[History] Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET /api/history/stats - Estatísticas resumidas
// ==========================================

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const stats = await historyService.getUserStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('[History] Erro ao buscar stats:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ==========================================
// GET /api/history/:gameId - Detalhes de uma partida
// ==========================================

export const getGameDetails = async (req: Request, res: Response) => {
  try {
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { gameId } = req.params;
    if (!gameId) {
      return res.status(400).json({ error: 'ID da partida não fornecido' });
    }

    const details = await historyService.getGameDetails(gameId, userId);

    if (!details) {
      return res.status(404).json({ error: 'Partida não encontrada ou você não participou' });
    }

    res.json(details);
  } catch (error) {
    console.error('[History] Erro ao buscar detalhes:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};
