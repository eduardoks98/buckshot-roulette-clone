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

    // Transformar snake_case para camelCase para o frontend
    const formattedData = result.data.map(game => ({
      id: game.id,
      roomCode: game.room_code,
      status: game.status,
      createdAt: game.created_at?.toISOString() || null,
      endedAt: game.ended_at?.toISOString() || null,
      totalRounds: game.total_rounds,
      position: game.position,
      roundsWon: game.rounds_won,
      kills: game.kills,
      deaths: game.deaths,
      damageDealt: game.damage_dealt,
      damageTaken: game.damage_taken,
      selfDamage: game.self_damage,
      shotsFired: game.shots_fired,
      itemsUsed: game.items_used,
      eloChange: game.elo_change,
      xpEarned: game.xp_earned,
      opponents: game.opponents.map(opp => ({
        displayName: opp.display_name,
        position: opp.position,
        eloRating: opp.elo_rating,
      })),
      winner: game.winner ? {
        id: game.winner.id,
        displayName: game.winner.display_name,
      } : null,
    }));

    res.json({
      data: formattedData,
      total: result.total,
      page: result.page,
      pages: result.pages,
    });
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

    // Transformar snake_case para camelCase
    const formattedDetails = {
      id: details.id,
      roomCode: details.room_code,
      status: details.status,
      createdAt: details.created_at?.toISOString() || null,
      endedAt: details.ended_at?.toISOString() || null,
      totalRounds: details.total_rounds,
      position: details.position,
      roundsWon: details.rounds_won,
      kills: details.kills,
      deaths: details.deaths,
      damageDealt: details.damage_dealt,
      damageTaken: details.damage_taken,
      selfDamage: details.self_damage,
      shotsFired: details.shots_fired,
      itemsUsed: details.items_used,
      eloChange: details.elo_change,
      xpEarned: details.xp_earned,
      winner: details.winner ? {
        id: details.winner.id,
        displayName: details.winner.display_name,
      } : null,
      participants: details.participants.map(p => ({
        userId: p.user_id,
        displayName: p.display_name,
        position: p.position,
        roundsWon: p.rounds_won,
        kills: p.kills,
        deaths: p.deaths,
        damageDealt: p.damage_dealt,
        damageTaken: p.damage_taken,
        selfDamage: p.self_damage,
        shotsFired: p.shots_fired,
        itemsUsed: p.items_used,
        eloChange: p.elo_change,
        xpEarned: p.xp_earned,
        eloRating: p.elo_rating,
      })),
      rounds: details.rounds.map(r => ({
        roundNumber: r.round_number,
        winnerId: r.winner_id,
        maxHp: r.max_hp,
        shellsLive: r.shells_live,
        shellsBlank: r.shells_blank,
        startedAt: r.started_at?.toISOString() || null,
        endedAt: r.ended_at?.toISOString() || null,
      })),
    };

    res.json(formattedDetails);
  } catch (error) {
    console.error('[History] Erro ao buscar detalhes:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};
