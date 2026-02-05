// ==========================================
// STATS TYPES - Sistema de Progressao (Estilo LoL Eternals)
// ==========================================

// ==========================================
// CATEGORIES
// ==========================================

export type StatCategory = 'combat' | 'matches' | 'items';

// ==========================================
// STAT KEYS
// ==========================================

export type StatKey =
  | 'kills'
  | 'deaths'
  | 'damageDealt'
  | 'liveHits'
  | 'sawedShots'
  | 'gamesPlayed'
  | 'wins'
  | 'bestWinStreak'
  | 'itemsUsed'
  | 'adrenalineUses'
  | 'handcuffUses'
  | 'infoItemUses'
  | 'expiredMedicineSurvived';

// ==========================================
// STAT DEFINITION
// ==========================================

export interface StatDefinition {
  key: StatKey;
  name: string;
  description: string;
  icon: string;
  category: StatCategory;
  milestones: number[];
  xpPerMilestone: number[];
  format?: 'number' | 'damage';
}

// ==========================================
// STAT PROGRESS
// ==========================================

export interface StatProgress {
  key: StatKey;
  value: number;
  currentMilestoneIndex: number;
  nextMilestone: number | null;
  progress: number; // 0-100
  completedMilestones: number[];
}

// ==========================================
// USER STATS (from database)
// ==========================================

export interface UserStats {
  kills: number;
  deaths: number;
  damageDealt: number;
  liveHits: number;
  sawedShots: number;
  gamesPlayed: number;
  wins: number;
  bestWinStreak: number;
  itemsUsed: number;
  adrenalineUses: number;
  handcuffUses: number;
  infoItemUses: number;
  expiredMedicineSurvived: number;
}

// ==========================================
// API RESPONSE
// ==========================================

export interface UserStatsResponse {
  userId: string;
  stats: UserStats;
  progress: StatProgress[];
  totalXpEarned: number;
  lastUpdated: string;
}

// ==========================================
// INITIAL VALUES
// ==========================================

export const INITIAL_USER_STATS: UserStats = {
  kills: 0,
  deaths: 0,
  damageDealt: 0,
  liveHits: 0,
  sawedShots: 0,
  gamesPlayed: 0,
  wins: 0,
  bestWinStreak: 0,
  itemsUsed: 0,
  adrenalineUses: 0,
  handcuffUses: 0,
  infoItemUses: 0,
  expiredMedicineSurvived: 0,
};
