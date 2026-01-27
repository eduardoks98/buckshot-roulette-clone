// ==========================================
// ACHIEVEMENT TYPES
// ==========================================

import { XpBreakdown } from '../utils/xpCalculator';

// ==========================================
// MILESTONE ACHIEVEMENTS
// ==========================================

export type MilestoneCategory = 'combat' | 'survival' | 'items' | 'games' | 'social';

export interface MilestoneDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: MilestoneCategory;
}

export interface AchievementUnlocked {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

// ==========================================
// MATCH BADGES
// ==========================================

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface MatchBadgeAwarded {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  playerId: string;
  playerName: string;
}

// ==========================================
// DYNAMIC TITLES
// ==========================================

export type TitlePeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export interface TitleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  period: TitlePeriod;
}

export interface ActiveTitle {
  titleId: string;
  name: string;
  icon: string;
  period: TitlePeriod;
}

// ==========================================
// USER ACHIEVEMENT PROFILE
// ==========================================

export interface UserAchievementProfile {
  milestones: {
    achievementId: string;
    unlockedAt: string;
    gameId?: string;
  }[];
  totalUnlocked: number;
  totalAvailable: number;
  activeTitle: ActiveTitle | null;
  recentBadges: {
    badgeId: string;
    gameId: string;
    awardedAt: string;
  }[];
}

// ==========================================
// XP RESULTS (for game over payload)
// ==========================================

export interface PlayerXpResult {
  odId: string;
  odUserId?: string;
  xpEarned: number;
  newTotalXp: number;
  previousLevel: number;
  newLevel: number;
  previousPrestige: number;
  newPrestige: number;
  breakdown: XpBreakdown;

  // Legacy ELO (mantido para compatibilidade)
  eloChange?: number;
  newEloRating?: number;

  // Novo Sistema de Ranking (LP + MMR)
  lpChange?: number;
  newLp?: number;
  mmrChange?: number;
  newMmr?: number;
  newTier?: string;
  newDivision?: number | null;
  displayRank?: string;
  promoted?: boolean;
  demoted?: boolean;
}

// ==========================================
// EXTENDED PLAYER STATS (for tracking)
// ==========================================

export interface ExtendedGameStats {
  // Standard stats
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  kills: number;
  deaths: number;

  // Extended tracking for achievements/badges
  sawedShots: number;
  liveHits: number;
  expiredMedicineSurvived: number;
  adrenalineUses: number;
  handcuffUses: number;
  infoItemUses: number;
  uniqueItemsUsed: string[];
  firstBloodInGame: boolean;
  maxConsecutiveTurnsAt1Hp: number;
  killsPerRound: number[];
  roundsSurvivedAsLast: number;
  roundWinsWithoutShots: number;
  roundWinsWithoutItems: number;
  finalHp: number;
}
