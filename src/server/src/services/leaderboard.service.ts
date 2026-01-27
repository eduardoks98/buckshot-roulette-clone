// ==========================================
// LEADERBOARD SERVICE
// ==========================================

import { LeaderboardPeriod } from '@prisma/client';
import prisma from '../lib/prisma';
import { getDisplayRank, TIERS, Tier } from '../../../shared/utils/rankingCalculator';

// ==========================================
// TYPES
// ==========================================

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  win_rate: number;
  elo_rating: number;
  elo_gain?: number;
  total_xp: number;
  active_title_id: string | null;
  // Novo sistema de ranking
  tier?: string;
  division?: number | null;
  lp?: number;
  displayRank?: string;
}

// ==========================================
// LEADERBOARD SERVICE CLASS
// ==========================================

export class LeaderboardService {
  // ==========================================
  // GET LEADERBOARD
  // ==========================================

  async getLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'all_time',
    limit: number = 100,
    userId?: string
  ): Promise<{ entries: LeaderboardEntry[]; myRank: number | null }> {
    let entries: LeaderboardEntry[];
    let myRank: number | null = null;

    if (period === 'all_time') {
      // Get from users table directly
      entries = await this.getAllTimeLeaderboard(limit);

      if (userId) {
        myRank = await this.getUserRankAllTime(userId);
      }
    } else {
      // Get from leaderboard entries
      const prismaPeriod = this.mapPeriod(period);
      const periodDates = this.getPeriodDates(period);

      entries = await this.getPeriodLeaderboard(prismaPeriod, periodDates, limit);

      if (userId) {
        myRank = await this.getUserRankPeriod(userId, prismaPeriod, periodDates);
      }
    }

    return { entries, myRank };
  }

  // ==========================================
  // ALL TIME LEADERBOARD
  // ==========================================

  private async getAllTimeLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    // Buscar usuários com jogos jogados
    const users = await prisma.user.findMany({
      where: {
        games_played: { gt: 0 },
      },
      // Não podemos ordenar por tier/division/lp diretamente no Prisma de forma complexa,
      // então buscamos todos e ordenamos em memória
      take: limit * 3, // Busca mais para garantir que temos suficientes após ordenação
    });

    // Ordenar por tier (índice), division (menor é melhor), lp (maior é melhor)
    const sorted = users.sort((a, b) => {
      // Primeiro: Tier (maior índice = melhor)
      const tierIndexA = TIERS.indexOf(a.tier as Tier);
      const tierIndexB = TIERS.indexOf(b.tier as Tier);
      if (tierIndexA !== tierIndexB) {
        return tierIndexB - tierIndexA; // Maior tier primeiro
      }

      // Segundo: Division (menor número = melhor, I=1 é melhor que IV=4)
      const divA = a.division ?? 0; // null (Master+) = 0 = melhor
      const divB = b.division ?? 0;
      if (divA !== divB) {
        return divA - divB; // Menor divisão primeiro
      }

      // Terceiro: LP (maior = melhor)
      return b.lp - a.lp;
    }).slice(0, limit);

    return sorted.map((user, index) => ({
      rank: index + 1,
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      games_played: user.games_played,
      games_won: user.games_won,
      win_rate: user.games_played > 0 ? (user.games_won / user.games_played) * 100 : 0,
      elo_rating: user.elo_rating,
      total_xp: user.total_xp,
      active_title_id: user.active_title_id,
      // Novo sistema de ranking
      tier: user.tier,
      division: user.division,
      lp: user.lp,
      displayRank: getDisplayRank(user.tier as Tier, user.division as 1 | 2 | 3 | 4 | null),
    }));
  }

  private async getUserRankAllTime(userId: string): Promise<number | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.games_played === 0) return null;

    // Contar jogadores com rank melhor
    // Como a ordenação é complexa (tier > division > lp), precisamos buscar todos
    const allUsers = await prisma.user.findMany({
      where: { games_played: { gt: 0 } },
      select: { id: true, tier: true, division: true, lp: true },
    });

    // Ordenar da mesma forma que getAllTimeLeaderboard
    const sorted = allUsers.sort((a, b) => {
      const tierIndexA = TIERS.indexOf(a.tier as Tier);
      const tierIndexB = TIERS.indexOf(b.tier as Tier);
      if (tierIndexA !== tierIndexB) return tierIndexB - tierIndexA;

      const divA = a.division ?? 0;
      const divB = b.division ?? 0;
      if (divA !== divB) return divA - divB;

      return b.lp - a.lp;
    });

    // Encontrar posição do usuário
    const position = sorted.findIndex(u => u.id === userId);
    return position !== -1 ? position + 1 : null;
  }

  // ==========================================
  // PERIOD LEADERBOARD
  // ==========================================

  private async getPeriodLeaderboard(
    period: LeaderboardPeriod,
    periodDates: { start: Date; end: Date },
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        period,
        period_start: periodDates.start,
        period_end: periodDates.end,
      },
      orderBy: {
        elo_gain: 'desc',
      },
      take: limit,
      include: {
        user: true,
      },
    });

    return entries.map((entry, index) => ({
      rank: index + 1,
      user_id: entry.user_id,
      username: entry.user.username,
      display_name: entry.user.display_name,
      avatar_url: entry.user.avatar_url,
      games_played: entry.games_played,
      games_won: entry.games_won,
      win_rate: entry.win_rate,
      elo_rating: entry.user.elo_rating,
      elo_gain: entry.elo_gain,
      total_xp: entry.user.total_xp,
      active_title_id: entry.user.active_title_id,
      // Novo sistema de ranking
      tier: entry.user.tier,
      division: entry.user.division,
      lp: entry.user.lp,
      displayRank: getDisplayRank(entry.user.tier as Tier, entry.user.division as 1 | 2 | 3 | 4 | null),
    }));
  }

  private async getUserRankPeriod(
    userId: string,
    period: LeaderboardPeriod,
    periodDates: { start: Date; end: Date }
  ): Promise<number | null> {
    const entry = await prisma.leaderboardEntry.findFirst({
      where: {
        user_id: userId,
        period,
        period_start: periodDates.start,
      },
    });

    if (!entry) return null;

    const higherRanked = await prisma.leaderboardEntry.count({
      where: {
        period,
        period_start: periodDates.start,
        elo_gain: { gt: entry.elo_gain },
      },
    });

    return higherRanked + 1;
  }

  // ==========================================
  // UPDATE LEADERBOARD
  // ==========================================

  async updatePlayerStats(
    userId: string,
    stats: {
      games_played: number;
      games_won: number;
      elo_change: number;
    }
  ): Promise<void> {
    const periods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

    for (const period of periods) {
      const dates = this.getPeriodDates(
        period.toLowerCase() as 'daily' | 'weekly' | 'monthly'
      );

      // Find or create entry
      const existing = await prisma.leaderboardEntry.findFirst({
        where: {
          user_id: userId,
          period,
          period_start: dates.start,
        },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;

      if (existing) {
        const newGamesPlayed = existing.games_played + stats.games_played;
        const newGamesWon = existing.games_won + stats.games_won;
        const newWinRate = newGamesPlayed > 0 ? (newGamesWon / newGamesPlayed) * 100 : 0;
        const newEloGain = existing.elo_gain + stats.elo_change;
        const newPeakElo = Math.max(existing.peak_elo, user.elo_rating);

        await prisma.leaderboardEntry.update({
          where: { id: existing.id },
          data: {
            games_played: newGamesPlayed,
            games_won: newGamesWon,
            win_rate: newWinRate,
            elo_gain: newEloGain,
            peak_elo: newPeakElo,
          },
        });
      } else {
        const winRate = stats.games_played > 0
          ? (stats.games_won / stats.games_played) * 100
          : 0;

        await prisma.leaderboardEntry.create({
          data: {
            user_id: userId,
            period,
            period_start: dates.start,
            period_end: dates.end,
            games_played: stats.games_played,
            games_won: stats.games_won,
            win_rate: winRate,
            elo_gain: stats.elo_change,
            peak_elo: user.elo_rating,
          },
        });
      }
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private mapPeriod(period: 'daily' | 'weekly' | 'monthly' | 'all_time'): LeaderboardPeriod {
    const map: Record<string, LeaderboardPeriod> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
      all_time: 'ALL_TIME',
    };
    return map[period];
  }

  private getPeriodDates(period: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        break;

      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        end = new Date(start);
        end.setDate(end.getDate() + 7);
        break;

      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
    }

    return { start, end };
  }
}

export const leaderboardService = new LeaderboardService();
