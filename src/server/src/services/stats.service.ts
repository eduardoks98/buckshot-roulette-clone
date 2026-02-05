// ==========================================
// STATS SERVICE
// Sistema de Estatisticas com Progressao
// ==========================================

import { PrismaClient } from '@prisma/client';
import {
  UserStats,
  StatProgress,
  UserStatsResponse,
  INITIAL_USER_STATS,
} from '../../../shared/types/stats.types';
import {
  STAT_DEFINITIONS,
  calculateStatProgress,
  calculateTotalXpEarned,
  mapDatabaseToUserStats,
} from '../../../shared/constants/stats';

const prisma = new PrismaClient();

// ==========================================
// STATS SERVICE CLASS
// ==========================================

export class StatsService {
  /**
   * Buscar stats do usuario com progresso calculado
   */
  async getUserStatsWithProgress(userId: string): Promise<UserStatsResponse> {
    // Buscar usuario do banco
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        total_kills: true,
        total_deaths: true,
        total_damage_dealt: true,
        total_live_hits: true,
        total_sawed_shots: true,
        games_played: true,
        games_won: true,
        best_win_streak: true,
        total_items_used: true,
        total_adrenaline_uses: true,
        total_handcuff_uses: true,
        total_info_item_uses: true,
        expired_medicine_survived: true,
      },
    });

    if (!user) {
      // Retornar stats zeradas se usuario nao existe
      const emptyProgress = this.calculateAllProgress(INITIAL_USER_STATS);
      return {
        userId,
        stats: INITIAL_USER_STATS,
        progress: emptyProgress,
        totalXpEarned: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Mapear dados do banco para UserStats
    const stats = mapDatabaseToUserStats(user);

    // Calcular progresso de cada stat
    const progress = this.calculateAllProgress(stats);

    // Calcular XP total ganho
    const totalXpEarned = calculateTotalXpEarned(progress);

    return {
      userId,
      stats,
      progress,
      totalXpEarned,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Buscar stats por gameUserId (ID do portal)
   */
  async getUserStatsByOdUserId(gameUserId: string): Promise<UserStatsResponse | null> {
    // Buscar usuario pelo game_user_id
    const user = await prisma.user.findFirst({
      where: { game_user_id: gameUserId },
      select: {
        id: true,
        total_kills: true,
        total_deaths: true,
        total_damage_dealt: true,
        total_live_hits: true,
        total_sawed_shots: true,
        games_played: true,
        games_won: true,
        best_win_streak: true,
        total_items_used: true,
        total_adrenaline_uses: true,
        total_handcuff_uses: true,
        total_info_item_uses: true,
        expired_medicine_survived: true,
      },
    });

    if (!user) {
      return null;
    }

    // Mapear dados do banco para UserStats
    const stats = mapDatabaseToUserStats(user);

    // Calcular progresso de cada stat
    const progress = this.calculateAllProgress(stats);

    // Calcular XP total ganho
    const totalXpEarned = calculateTotalXpEarned(progress);

    return {
      userId: user.id,
      stats,
      progress,
      totalXpEarned,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calcular progresso de todas as estatisticas
   */
  private calculateAllProgress(stats: UserStats): StatProgress[] {
    return STAT_DEFINITIONS.map((definition) => {
      const value = stats[definition.key] ?? 0;
      return calculateStatProgress(definition, value);
    });
  }
}

export const statsService = new StatsService();
