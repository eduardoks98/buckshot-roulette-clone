// ==========================================
// XP CALCULATOR
// Sistema de XP, Levels e Prestige
// ==========================================

export const XP_CONSTANTS = {
  PRESTIGE_EVERY: 50,
  LEVEL_BASE: 100,
  LEVEL_EXPONENT: 1.5,
  PRESTIGE_XP_BONUS_PER_LEVEL: 0.05,
} as const;

export const XP_AWARDS = {
  PARTICIPATION: 50,
  WIN_BONUS: 100,
  SECOND_PLACE: 40,
  THIRD_PLACE: 20,
  PER_KILL: 25,
  PER_ROUND_WON: 30,
  PER_DAMAGE_DEALT: 5,
  PER_ITEM_USED: 3,
  PER_ROUND_SURVIVED: 15,
  CLEAN_PLAY_BONUS: 10,
} as const;

// ==========================================
// TYPES
// ==========================================

export interface XpCalculationInput {
  position: number;
  totalPlayers: number;
  kills: number;
  roundsWon: number;
  totalRounds: number;
  damageDealt: number;
  itemsUsed: number;
  selfDamage: number;
  deaths: number;
  prestigeLevel: number;
}

export interface XpBreakdown {
  participation: number;
  positionBonus: number;
  killXp: number;
  roundWinXp: number;
  damageXp: number;
  itemXp: number;
  survivalXp: number;
  cleanPlayBonus: number;
}

export interface XpCalculationResult {
  baseXp: number;
  prestigeMultiplier: number;
  totalXp: number;
  breakdown: XpBreakdown;
}

export interface LevelInfo {
  absoluteLevel: number;
  displayLevel: number;
  prestigeLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  totalXp: number;
}

// ==========================================
// FUNCTIONS
// ==========================================

export function xpRequiredForLevel(level: number): number {
  return Math.floor(XP_CONSTANTS.LEVEL_BASE * Math.pow(level, XP_CONSTANTS.LEVEL_EXPONENT));
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let remainingXp = totalXp;
  let level = 0;

  while (true) {
    const needed = xpRequiredForLevel(level + 1);
    if (remainingXp < needed) break;
    remainingXp -= needed;
    level++;
  }

  const prestigeLevel = Math.floor(level / XP_CONSTANTS.PRESTIGE_EVERY);
  const displayLevel = (level % XP_CONSTANTS.PRESTIGE_EVERY) + 1;
  const xpForNextLevel = xpRequiredForLevel(level + 1);

  return {
    absoluteLevel: level,
    displayLevel,
    prestigeLevel,
    xpInCurrentLevel: remainingXp,
    xpForNextLevel,
    xpProgress: xpForNextLevel > 0 ? remainingXp / xpForNextLevel : 0,
    totalXp,
  };
}

export function calculateXpGain(input: XpCalculationInput): XpCalculationResult {
  const {
    position, totalPlayers, kills, roundsWon, totalRounds,
    damageDealt, itemsUsed, selfDamage, deaths, prestigeLevel,
  } = input;

  let positionBonus = 0;
  if (position === 1) positionBonus = XP_AWARDS.WIN_BONUS;
  else if (position === 2 && totalPlayers >= 3) positionBonus = XP_AWARDS.SECOND_PLACE;
  else if (position === 3 && totalPlayers >= 4) positionBonus = XP_AWARDS.THIRD_PLACE;

  const killXp = kills * XP_AWARDS.PER_KILL;
  const roundWinXp = roundsWon * XP_AWARDS.PER_ROUND_WON;
  const damageXp = damageDealt * XP_AWARDS.PER_DAMAGE_DEALT;
  const itemXp = itemsUsed * XP_AWARDS.PER_ITEM_USED;
  const roundsSurvived = Math.max(0, totalRounds - deaths);
  const survivalXp = roundsSurvived * XP_AWARDS.PER_ROUND_SURVIVED;
  const cleanPlayBonus = selfDamage === 0 ? XP_AWARDS.CLEAN_PLAY_BONUS : 0;

  const baseXp = XP_AWARDS.PARTICIPATION + positionBonus + killXp +
                 roundWinXp + damageXp + itemXp + survivalXp + cleanPlayBonus;

  const multiplier = 1.0 + (prestigeLevel * XP_CONSTANTS.PRESTIGE_XP_BONUS_PER_LEVEL);
  const totalXp = Math.round(baseXp * multiplier);

  return {
    baseXp,
    prestigeMultiplier: multiplier,
    totalXp,
    breakdown: {
      participation: XP_AWARDS.PARTICIPATION,
      positionBonus,
      killXp,
      roundWinXp,
      damageXp,
      itemXp,
      survivalXp,
      cleanPlayBonus,
    },
  };
}
