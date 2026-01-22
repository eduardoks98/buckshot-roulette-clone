// ==========================================
// LEADERBOARD SERVICE
// ==========================================

import { PrismaClient, LeaderboardPeriod } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// TYPES
// ==========================================

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  eloRating: number;
  eloGain?: number;
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
    const users = await prisma.user.findMany({
      where: {
        gamesPlayed: { gt: 0 },
      },
      orderBy: {
        eloRating: 'desc',
      },
      take: limit,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed) * 100 : 0,
      eloRating: user.eloRating,
    }));
  }

  private async getUserRankAllTime(userId: string): Promise<number | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.gamesPlayed === 0) return null;

    const higherRanked = await prisma.user.count({
      where: {
        gamesPlayed: { gt: 0 },
        eloRating: { gt: user.eloRating },
      },
    });

    return higherRanked + 1;
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
        periodStart: periodDates.start,
        periodEnd: periodDates.end,
      },
      orderBy: {
        eloGain: 'desc',
      },
      take: limit,
      include: {
        user: true,
      },
    });

    return entries.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      username: entry.user.username,
      displayName: entry.user.displayName,
      avatarUrl: entry.user.avatarUrl,
      gamesPlayed: entry.gamesPlayed,
      gamesWon: entry.gamesWon,
      winRate: entry.winRate,
      eloRating: entry.user.eloRating,
      eloGain: entry.eloGain,
    }));
  }

  private async getUserRankPeriod(
    userId: string,
    period: LeaderboardPeriod,
    periodDates: { start: Date; end: Date }
  ): Promise<number | null> {
    const entry = await prisma.leaderboardEntry.findFirst({
      where: {
        userId,
        period,
        periodStart: periodDates.start,
      },
    });

    if (!entry) return null;

    const higherRanked = await prisma.leaderboardEntry.count({
      where: {
        period,
        periodStart: periodDates.start,
        eloGain: { gt: entry.eloGain },
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
      gamesPlayed: number;
      gamesWon: number;
      eloChange: number;
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
          userId,
          period,
          periodStart: dates.start,
        },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;

      if (existing) {
        const newGamesPlayed = existing.gamesPlayed + stats.gamesPlayed;
        const newGamesWon = existing.gamesWon + stats.gamesWon;
        const newWinRate = newGamesPlayed > 0 ? (newGamesWon / newGamesPlayed) * 100 : 0;
        const newEloGain = existing.eloGain + stats.eloChange;
        const newPeakElo = Math.max(existing.peakElo, user.eloRating);

        await prisma.leaderboardEntry.update({
          where: { id: existing.id },
          data: {
            gamesPlayed: newGamesPlayed,
            gamesWon: newGamesWon,
            winRate: newWinRate,
            eloGain: newEloGain,
            peakElo: newPeakElo,
          },
        });
      } else {
        const winRate = stats.gamesPlayed > 0
          ? (stats.gamesWon / stats.gamesPlayed) * 100
          : 0;

        await prisma.leaderboardEntry.create({
          data: {
            userId,
            period,
            periodStart: dates.start,
            periodEnd: dates.end,
            gamesPlayed: stats.gamesPlayed,
            gamesWon: stats.gamesWon,
            winRate,
            eloGain: stats.eloChange,
            peakElo: user.eloRating,
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
