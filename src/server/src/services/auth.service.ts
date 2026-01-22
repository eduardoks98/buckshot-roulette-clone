// ==========================================
// AUTH SERVICE
// ==========================================

import { PrismaClient, User, Session } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

const prisma = new PrismaClient();

// ==========================================
// TYPES
// ==========================================

interface TokenPayload {
  userId: string;
  sessionId: string;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  gamesPlayed: number;
  gamesWon: number;
  roundsPlayed: number;
  roundsWon: number;
  totalKills: number;
  totalDeaths: number;
  eloRating: number;
  rank: string;
}

// ==========================================
// AUTH SERVICE CLASS
// ==========================================

export class AuthService {
  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  async createSession(userId: string): Promise<{ session: Session; token: string }> {
    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId,
        token: sessionToken,
        expiresAt,
      },
    });

    // Generate JWT
    const jwtPayload: TokenPayload = {
      userId,
      sessionId: session.id,
    };

    const token = jwt.sign(jwtPayload, env.JWT_SECRET, {
      expiresIn: 604800, // 7 dias em segundos
    });

    return { session, token };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

      // Check session exists and is not expired
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return session.user;
    } catch {
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId },
    }).catch(() => {
      // Ignore if session doesn't exist
    });
  }

  async invalidateAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      roundsPlayed: user.roundsPlayed,
      roundsWon: user.roundsWon,
      totalKills: user.totalKills,
      totalDeaths: user.totalDeaths,
      eloRating: user.eloRating,
      rank: user.rank,
    };
  }

  async updateUserStats(
    userId: string,
    stats: {
      gamesPlayed?: number;
      gamesWon?: number;
      roundsPlayed?: number;
      roundsWon?: number;
      totalKills?: number;
      totalDeaths?: number;
      eloChange?: number;
    }
  ): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario nao encontrado');

    const newElo = (user.eloRating || 1000) + (stats.eloChange || 0);
    const newRank = this.calculateRank(newElo);

    return prisma.user.update({
      where: { id: userId },
      data: {
        gamesPlayed: { increment: stats.gamesPlayed || 0 },
        gamesWon: { increment: stats.gamesWon || 0 },
        roundsPlayed: { increment: stats.roundsPlayed || 0 },
        roundsWon: { increment: stats.roundsWon || 0 },
        totalKills: { increment: stats.totalKills || 0 },
        totalDeaths: { increment: stats.totalDeaths || 0 },
        eloRating: newElo,
        rank: newRank,
      },
    });
  }

  // ==========================================
  // ELO & RANKING
  // ==========================================

  calculateEloChange(
    playerElo: number,
    opponentElo: number,
    won: boolean,
    kFactor: number = 32
  ): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const actualScore = won ? 1 : 0;
    return Math.round(kFactor * (actualScore - expectedScore));
  }

  private calculateRank(elo: number): string {
    if (elo >= 2400) return 'Grandmaster';
    if (elo >= 2100) return 'Master';
    if (elo >= 1800) return 'Diamond';
    if (elo >= 1500) return 'Platinum';
    if (elo >= 1200) return 'Gold';
    if (elo >= 900) return 'Silver';
    return 'Bronze';
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

export const authService = new AuthService();
