// ==========================================
// AUTH SERVICE
// ==========================================

import { User, Session } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import prisma from '../lib/prisma';

// ==========================================
// TYPES
// ==========================================

// Local token payload (BangShot sessions)
interface TokenPayload {
  userId: string;
  sessionId: string;
}

// Games Admin token payload (Centralized OAuth)
interface GamesAdminTokenPayload {
  sub: string; // game_user_id
  game: string; // game_code
  iat: number;
  exp: number;
}

// Games Admin API validation response
interface GamesAdminValidateResponse {
  valid: boolean;
  user?: {
    email: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    elo_rating?: number;
    rank?: string;
    is_admin?: boolean;
  };
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  rounds_played: number;
  rounds_won: number;
  total_kills: number;
  total_deaths: number;
  elo_rating: number;
  rank: string;
  total_xp: number;
  is_admin: boolean;
  active_title_id: string | null;
  // New ranking system
  tier: string;
  division: number | null;
  lp: number;
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
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    // Create session in database
    const session = await prisma.session.create({
      data: {
        user_id: userId,
        token: sessionToken,
        expires_at,
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
    // Try Games Admin token first (centralized OAuth)
    const gamesAdminUser = await this.validateGamesAdminToken(token);
    if (gamesAdminUser) {
      return gamesAdminUser;
    }

    // Fallback to local token validation (existing sessions)
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

      // Check session exists and is not expired
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true },
      });

      if (!session || session.expires_at < new Date()) {
        return null;
      }

      return session.user;
    } catch {
      return null;
    }
  }

  /**
   * Validate a Games Admin JWT token and sync/create user locally
   */
  async validateGamesAdminToken(token: string): Promise<User | null> {
    try {
      // Games Admin uses Laravel's APP_KEY as-is (including "base64:" prefix)
      // The PHP JWT library uses the full string for signing, not the decoded bytes
      const secret = env.GAMES_ADMIN_JWT_SECRET;
      if (!secret) {
        console.log('[Auth] GAMES_ADMIN_JWT_SECRET not configured');
        return null;
      }

      console.log('[Auth] Validating token with secret length:', secret.length);
      console.log('[Auth] Token preview:', token.substring(0, 50) + '...');

      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as GamesAdminTokenPayload;
      console.log('[Auth] Token decoded successfully:', { sub: decoded.sub, game: decoded.game });

      // SSO: Accept tokens from any game (PORTAL, BANGSHOT, etc.)
      // This allows centralized login via MySys Portal

      // Find or sync user locally
      // The 'sub' is the game_user_id from Games Admin
      const gameUserId = decoded.sub;

      // Try to find user by game_user_id first
      let user = await prisma.user.findFirst({
        where: { game_user_id: gameUserId },
      });

      if (!user) {
        // Fetch user data from Games Admin and create locally
        user = await this.syncUserFromGamesAdmin(token, gameUserId);
      }

      return user;
    } catch (error) {
      // Token is not a valid Games Admin token
      console.error('[Auth] validateGamesAdminToken error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Sync user data from Games Admin API
   */
  async syncUserFromGamesAdmin(token: string, gameUserId: string): Promise<User | null> {
    try {
      const response = await fetch(
        `${env.GAMES_ADMIN_API_URL}/api/games/${env.GAME_CODE}/auth/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as GamesAdminValidateResponse;
      if (!data.valid || !data.user) {
        return null;
      }

      const adminUser = data.user;

      // Try to find by email first (for existing users)
      let user = await prisma.user.findUnique({
        where: { email: adminUser.email },
      });

      if (user) {
        // Update with game_user_id
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            game_user_id: gameUserId,
            display_name: adminUser.display_name,
            avatar_url: adminUser.avatar_url,
            last_login_at: new Date(),
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            game_user_id: gameUserId,
            email: adminUser.email,
            username: adminUser.username,
            display_name: adminUser.display_name,
            avatar_url: adminUser.avatar_url,
            elo_rating: adminUser.elo_rating || 0,
            rank: adminUser.rank || 'Bronze',
            is_admin: adminUser.is_admin || false,
            last_login_at: new Date(),
          },
        });
      }

      return user;
    } catch (error) {
      console.error('[Auth] Error syncing user from Games Admin:', error);
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
      where: { user_id: userId },
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
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      games_played: user.games_played,
      games_won: user.games_won,
      rounds_played: user.rounds_played,
      rounds_won: user.rounds_won,
      total_kills: user.total_kills,
      total_deaths: user.total_deaths,
      elo_rating: user.elo_rating,
      rank: user.rank,
      total_xp: user.total_xp,
      is_admin: user.is_admin,
      active_title_id: user.active_title_id,
      // New ranking system
      tier: user.tier,
      division: user.division,
      lp: user.lp,
    };
  }

  async updateUserStats(
    userId: string,
    stats: {
      games_played?: number;
      games_won?: number;
      rounds_played?: number;
      rounds_won?: number;
      total_kills?: number;
      total_deaths?: number;
      elo_change?: number;
    }
  ): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario nao encontrado');

    const newElo = (user.elo_rating || 0) + (stats.elo_change || 0);
    const newRank = this.calculateRank(newElo);

    return prisma.user.update({
      where: { id: userId },
      data: {
        games_played: { increment: stats.games_played || 0 },
        games_won: { increment: stats.games_won || 0 },
        rounds_played: { increment: stats.rounds_played || 0 },
        rounds_won: { increment: stats.rounds_won || 0 },
        total_kills: { increment: stats.total_kills || 0 },
        total_deaths: { increment: stats.total_deaths || 0 },
        elo_rating: newElo,
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
        expires_at: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

export const authService = new AuthService();
