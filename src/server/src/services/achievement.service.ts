// ==========================================
// ACHIEVEMENT SERVICE
// ==========================================

import prisma from '../lib/prisma';
import {
  MILESTONES,
  BADGES,
  TITLES,
  ALL_ITEMS_BITMASK,
  getMilestoneById,
  getBadgeById,
  getTitleById,
} from '../../../shared/constants/achievements';
import {
  AchievementUnlocked,
  MatchBadgeAwarded,
  TitlePeriod,
} from '../../../shared/types/achievement.types';
import { GAME_RULES } from '../../../shared/constants';

// ==========================================
// TYPES
// ==========================================

interface PlayerEndGameStats {
  odId: string;          // Socket ID
  odUserId?: string;     // User ID if logged in
  playerName: string;
  position: number;
  roundsWon: number;
  totalRounds: number;
  totalPlayers: number;

  // Standard stats
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  kills: number;
  deaths: number;

  // Extended tracking
  sawedShots: number;
  liveHits: number;
  expiredMedicineSurvived: number;
  adrenalineUses: number;
  handcuffUses: number;
  infoItemUses: number;
  itemsUsedBitmask: number;
  firstBloodInGame: boolean;
  maxConsecutiveTurnsAt1Hp: number;
  killsPerRound: number[];
  roundsSurvivedAsLast: number;
  wonRoundWithZeroShots: boolean;
  wonRoundWithZeroItems: boolean;
  finalHp: number;
  uniqueItemsUsedInGame: number;
  adrenalineUsesInGame: number;
  expiredMedicineSurvivedInGame: number;
  liveHitsInGame: number;
  allShotsLiveInGame: boolean;
  lostEarlyRounds: boolean;

  // Context
  isWinner: boolean;
  playerElo?: number;
  allPlayersElo?: number[];
  lowestEloInGame?: boolean;
}

interface ProcessGameEndResult {
  // Per-player results
  newAchievements: Map<string, AchievementUnlocked[]>;  // odId -> achievements
  badges: MatchBadgeAwarded[];
}

// ==========================================
// SERVICE CLASS
// ==========================================

class AchievementService {

  // ==========================================
  // MAIN ENTRY POINT
  // ==========================================

  async processGameEnd(
    gameId: string,
    playerStats: PlayerEndGameStats[]
  ): Promise<ProcessGameEndResult> {
    const result: ProcessGameEndResult = {
      newAchievements: new Map(),
      badges: [],
    };

    // 1. Compute badges for all players
    const badges = this.computeBadges(playerStats);
    result.badges = badges;

    // 2. Save badges to DB and check milestones for logged-in players
    for (const stats of playerStats) {
      if (!stats.odUserId) continue; // Skip guests

      // Save badges for this player
      const playerBadges = badges.filter(b => b.playerId === stats.odId);
      for (const badge of playerBadges) {
        try {
          // Find participant ID
          const participant = await prisma.gameParticipant.findFirst({
            where: { game_id: gameId, user_id: stats.odUserId },
            select: { id: true },
          });

          if (participant) {
            await prisma.gameBadge.create({
              data: {
                game_id: gameId,
                participant_id: participant.id,
                user_id: stats.odUserId,
                badge_id: badge.badgeId,
              },
            });
          }
        } catch (error) {
          // Ignore duplicate badge errors (unique constraint)
          console.error(`[Achievement] Erro ao salvar badge ${badge.badgeId}:`, error);
        }
      }

      // Update user tracking fields
      try {
        // First read current values needed for bitmask OR and streak calculation
        const user = await prisma.user.findUnique({
          where: { id: stats.odUserId },
          select: {
            items_used_bitmask: true,
            best_win_streak: true,
            current_win_streak: true,
          },
        });

        if (user) {
          const newBitmask = user.items_used_bitmask | stats.itemsUsedBitmask;
          const newCurrentStreak = stats.isWinner ? user.current_win_streak + 1 : 0;
          const newBestStreak = Math.max(user.best_win_streak, newCurrentStreak);

          await prisma.user.update({
            where: { id: stats.odUserId },
            data: {
              total_sawed_shots: { increment: stats.sawedShots },
              total_live_hits: { increment: stats.liveHits },
              total_damage_dealt: { increment: stats.damageDealt },
              total_items_used: { increment: stats.itemsUsed },
              expired_medicine_survived: { increment: stats.expiredMedicineSurvived },
              total_adrenaline_uses: { increment: stats.adrenalineUses },
              total_handcuff_uses: { increment: stats.handcuffUses },
              total_info_item_uses: { increment: stats.infoItemUses },
              items_used_bitmask: newBitmask,
              current_win_streak: newCurrentStreak,
              best_win_streak: newBestStreak,
            },
          });
        }
      } catch (error) {
        console.error(`[Achievement] Erro ao atualizar tracking fields:`, error);
      }

      // Check milestones
      try {
        const newMilestones = await this.checkMilestones(stats.odUserId, gameId, stats);
        if (newMilestones.length > 0) {
          result.newAchievements.set(stats.odId, newMilestones);
        }
      } catch (error) {
        console.error(`[Achievement] Erro ao verificar milestones:`, error);
      }
    }

    // 3. Recalculate dynamic titles (fire-and-forget, don't block game end)
    this.recalculateTitles().catch(err => {
      console.error('[Achievement] Erro ao recalcular titulos:', err);
    });

    return result;
  }

  // ==========================================
  // MILESTONE CHECKING
  // ==========================================

  async checkMilestones(
    userId: string,
    gameId: string,
    gameStats: PlayerEndGameStats
  ): Promise<AchievementUnlocked[]> {
    // Get user's current accumulated stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        games_played: true,
        games_won: true,
        rounds_played: true,
        rounds_won: true,
        total_kills: true,
        total_deaths: true,
        total_sawed_shots: true,
        total_live_hits: true,
        total_damage_dealt: true,
        total_items_used: true,
        expired_medicine_survived: true,
        total_adrenaline_uses: true,
        total_handcuff_uses: true,
        total_info_item_uses: true,
        items_used_bitmask: true,
        best_win_streak: true,
        user_achievements: {
          select: { achievement_id: true },
        },
      },
    });

    if (!user) return [];

    const alreadyUnlocked = new Set(user.user_achievements.map(a => a.achievement_id));
    const newlyUnlocked: AchievementUnlocked[] = [];

    // Check each milestone condition
    const conditions: Record<string, boolean> = {
      // COMBAT
      first_blood: user.total_kills >= 1,
      serial_killer: user.total_kills >= 10,
      centurion: user.total_kills >= 100,
      angel_of_death: user.total_kills >= 500,
      demolisher: user.total_damage_dealt >= 50,
      sniper: user.total_live_hits >= 100,
      saw_master: user.total_sawed_shots >= 20,

      // SURVIVAL
      survivor: user.rounds_played >= 10,
      iron_will: user.rounds_played >= 100,
      pharmacist: user.expired_medicine_survived >= 10,
      pacifist: gameStats.wonRoundWithZeroShots && gameStats.roundsWon > 0,
      last_stand: gameStats.isWinner && gameStats.finalHp === 1,

      // ITEMS
      collector: (user.items_used_bitmask & ALL_ITEMS_BITMASK) === ALL_ITEMS_BITMASK,
      item_hoarder: user.total_items_used >= 100,
      thief: user.total_adrenaline_uses >= 10,
      chain_master: user.total_handcuff_uses >= 20,
      fortune_teller: user.total_info_item_uses >= 30,

      // GAMES
      rookie: user.games_played >= 1,
      veteran: user.games_played >= 100,
      champion: user.games_won >= 10,
      unbeatable: user.best_win_streak >= 10,
      dominator: gameStats.isWinner && gameStats.roundsWon >= GAME_RULES.MAX_ROUNDS,

      // SOCIAL
      full_house: gameStats.totalPlayers >= 4,
      // social_butterfly and rival need DB queries - check separately
    };

    for (const [milestoneId, condition] of Object.entries(conditions)) {
      if (condition && !alreadyUnlocked.has(milestoneId)) {
        const milestone = getMilestoneById(milestoneId);
        if (milestone) {
          try {
            await prisma.userAchievement.create({
              data: {
                user_id: userId,
                achievement_id: milestoneId,
                game_id: gameId,
              },
            });

            newlyUnlocked.push({
              achievementId: milestoneId,
              name: milestone.name,
              description: milestone.description,
              icon: milestone.icon,
              unlockedAt: new Date().toISOString(),
            });

            console.log(`[Achievement] ${userId} desbloqueou: ${milestone.name}`);
          } catch (error) {
            // Unique constraint violation = already unlocked (race condition)
          }
        }
      }
    }

    // Check social achievements that need DB queries
    if (!alreadyUnlocked.has('social_butterfly')) {
      try {
        const distinctOpponents = await prisma.gameParticipant.findMany({
          where: {
            game: {
              game_participants: {
                some: { user_id: userId },
              },
            },
            user_id: { not: userId },
            NOT: { user_id: null },
          },
          select: { user_id: true },
          distinct: ['user_id'],
        });

        if (distinctOpponents.length >= 10) {
          const milestone = getMilestoneById('social_butterfly');
          if (milestone) {
            try {
              await prisma.userAchievement.create({
                data: { user_id: userId, achievement_id: 'social_butterfly', game_id: gameId },
              });
              newlyUnlocked.push({
                achievementId: 'social_butterfly',
                name: milestone.name,
                description: milestone.description,
                icon: milestone.icon,
                unlockedAt: new Date().toISOString(),
              });
            } catch {}
          }
        }
      } catch (error) {
        console.error('[Achievement] Erro ao verificar social_butterfly:', error);
      }
    }

    if (!alreadyUnlocked.has('rival')) {
      try {
        // Find most frequent opponent
        const opponents = await prisma.$queryRaw<{ cnt: bigint }[]>`
          SELECT COUNT(*) as cnt
          FROM GameParticipant gp1
          JOIN GameParticipant gp2 ON gp1.game_id = gp2.game_id AND gp1.user_id != gp2.user_id
          WHERE gp1.user_id = ${userId} AND gp2.user_id IS NOT NULL
          GROUP BY gp2.user_id
          ORDER BY cnt DESC
          LIMIT 1
        `;

        if (opponents.length > 0 && Number(opponents[0].cnt) >= 5) {
          const milestone = getMilestoneById('rival');
          if (milestone) {
            try {
              await prisma.userAchievement.create({
                data: { user_id: userId, achievement_id: 'rival', game_id: gameId },
              });
              newlyUnlocked.push({
                achievementId: 'rival',
                name: milestone.name,
                description: milestone.description,
                icon: milestone.icon,
                unlockedAt: new Date().toISOString(),
              });
            } catch {}
          }
        }
      } catch (error) {
        console.error('[Achievement] Erro ao verificar rival:', error);
      }
    }

    return newlyUnlocked;
  }

  // ==========================================
  // BADGE COMPUTATION
  // ==========================================

  computeBadges(playerStats: PlayerEndGameStats[]): MatchBadgeAwarded[] {
    const badges: MatchBadgeAwarded[] = [];
    const totalPlayers = playerStats.length;
    const maxPosition = Math.max(...playerStats.map(p => p.position));

    for (const stats of playerStats) {
      const earnedBadgeIds: string[] = [];

      // badge_flawless: Win without taking damage
      if (stats.isWinner && stats.damageTaken === 0) {
        earnedBadgeIds.push('badge_flawless');
      }

      // badge_clutch: Win with 1 HP
      if (stats.isWinner && stats.finalHp === 1) {
        earnedBadgeIds.push('badge_clutch');
      }

      // badge_dominator: 3+ kills
      if (stats.kills >= 3) {
        earnedBadgeIds.push('badge_dominator');
      }

      // badge_berserker: 10+ damage dealt
      if (stats.damageDealt >= 10) {
        earnedBadgeIds.push('badge_berserker');
      }

      // badge_lucky: Survive expired medicine 2x in one game
      if (stats.expiredMedicineSurvivedInGame >= 2) {
        earnedBadgeIds.push('badge_lucky');
      }

      // badge_pacifist: Win without dealing damage
      if (stats.isWinner && stats.damageDealt === 0) {
        earnedBadgeIds.push('badge_pacifist');
      }

      // badge_sweep: Win 3/3 rounds (all rounds)
      if (stats.isWinner && stats.roundsWon >= stats.totalRounds && stats.totalRounds >= GAME_RULES.MAX_ROUNDS) {
        earnedBadgeIds.push('badge_sweep');
      }

      // badge_tank: Take 8+ damage and not last place
      if (stats.damageTaken >= 8 && stats.position < maxPosition) {
        earnedBadgeIds.push('badge_tank');
      }

      // badge_kamikaze: 3+ self-damage
      if (stats.selfDamage >= 3) {
        earnedBadgeIds.push('badge_kamikaze');
      }

      // badge_marksman: 100% live shots (min 3 shots)
      if (stats.shotsFired >= 3 && stats.allShotsLiveInGame && stats.liveHitsInGame === stats.shotsFired) {
        earnedBadgeIds.push('badge_marksman');
      }

      // badge_hoarder: 8+ items used
      if (stats.itemsUsed >= 8) {
        earnedBadgeIds.push('badge_hoarder');
      }

      // badge_tactician: 4+ different item types used
      if (stats.uniqueItemsUsedInGame >= 4) {
        earnedBadgeIds.push('badge_tactician');
      }

      // badge_underdog: Win with lowest ELO
      if (stats.isWinner && stats.lowestEloInGame) {
        earnedBadgeIds.push('badge_underdog');
      }

      // badge_comeback: Win after losing rounds
      if (stats.isWinner && stats.lostEarlyRounds) {
        earnedBadgeIds.push('badge_comeback');
      }

      // badge_first_blood: First kill in the game
      if (stats.firstBloodInGame) {
        earnedBadgeIds.push('badge_first_blood');
      }

      // badge_survivor: Last alive in 2+ rounds
      if (stats.roundsSurvivedAsLast >= 2) {
        earnedBadgeIds.push('badge_survivor');
      }

      // badge_thief: 3+ adrenalines in one game
      if (stats.adrenalineUsesInGame >= 3) {
        earnedBadgeIds.push('badge_thief');
      }

      // badge_executioner: 2+ kills in a single round
      const maxKillsInRound = stats.killsPerRound.length > 0 ? Math.max(...stats.killsPerRound) : 0;
      if (maxKillsInRound >= 2) {
        earnedBadgeIds.push('badge_executioner');
      }

      // badge_no_items: Win a round without using items
      if (stats.wonRoundWithZeroItems) {
        earnedBadgeIds.push('badge_no_items');
      }

      // badge_close_call: 1 HP for 3+ consecutive turns
      if (stats.maxConsecutiveTurnsAt1Hp >= 3) {
        earnedBadgeIds.push('badge_close_call');
      }

      // Convert badge IDs to MatchBadgeAwarded objects
      for (const badgeId of earnedBadgeIds) {
        const badgeDef = getBadgeById(badgeId);
        if (badgeDef) {
          badges.push({
            badgeId,
            name: badgeDef.name,
            description: badgeDef.description,
            icon: badgeDef.icon,
            playerId: stats.odId,
            playerName: stats.playerName,
          });
        }
      }
    }

    return badges;
  }

  // ==========================================
  // USER ACHIEVEMENT PROFILE
  // ==========================================

  async getUserAchievements(userId: string) {
    const [achievements, recentBadges, activeTitle] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { user_id: userId },
        select: {
          achievement_id: true,
          unlocked_at: true,
          game_id: true,
        },
        orderBy: { unlocked_at: 'desc' },
      }),
      prisma.gameBadge.findMany({
        where: { user_id: userId },
        select: {
          badge_id: true,
          game_id: true,
          awarded_at: true,
        },
        orderBy: { awarded_at: 'desc' },
        take: 20,
      }),
      prisma.userTitle.findFirst({
        where: { user_id: userId, is_active: true },
        select: {
          title_id: true,
          period: true,
        },
        orderBy: { awarded_at: 'desc' },
      }),
    ]);

    return {
      milestones: achievements.map(a => ({
        achievementId: a.achievement_id,
        unlockedAt: a.unlocked_at.toISOString(),
        gameId: a.game_id || undefined,
      })),
      totalUnlocked: achievements.length,
      totalAvailable: MILESTONES.length,
      activeTitle: activeTitle ? (() => {
        const def = getTitleById(activeTitle.title_id);
        return {
          titleId: activeTitle.title_id,
          name: def?.name || '',
          icon: def?.icon || '',
          period: activeTitle.period as TitlePeriod,
        };
      })() : null,
      recentBadges: recentBadges.map(b => ({
        badgeId: b.badge_id,
        gameId: b.game_id,
        awardedAt: b.awarded_at.toISOString(),
      })),
    };
  }

  // ==========================================
  // GAME BADGES BY GAME ID
  // ==========================================

  async getGameBadges(gameId: string) {
    const badges = await prisma.gameBadge.findMany({
      where: { game_id: gameId },
      select: {
        badge_id: true,
        user_id: true,
        awarded_at: true,
        user: {
          select: {
            display_name: true,
          },
        },
      },
    });

    return badges.map(b => ({
      badgeId: b.badge_id,
      userId: b.user_id,
      playerName: b.user.display_name,
      awardedAt: b.awarded_at.toISOString(),
    }));
  }

  // ==========================================
  // SET ACTIVE TITLE
  // ==========================================

  async setActiveTitle(userId: string, titleId: string | null): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { active_title_id: titleId },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getActiveTitle(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { active_title_id: true },
    });

    if (!user?.active_title_id) return null;

    const title = await prisma.userTitle.findFirst({
      where: { user_id: userId, title_id: user.active_title_id, is_active: true },
      select: { title_id: true, period: true },
    });

    if (!title) return null;

    const def = getTitleById(title.title_id);
    return {
      titleId: title.title_id,
      name: def?.name || '',
      icon: def?.icon || '',
      period: title.period as TitlePeriod,
    };
  }

  // ==========================================
  // GET USER TITLES (all earned titles)
  // ==========================================

  async getUserTitles(userId: string) {
    const titles = await prisma.userTitle.findMany({
      where: { user_id: userId, is_active: true },
      select: {
        title_id: true,
        period: true,
        awarded_at: true,
        expires_at: true,
      },
      orderBy: { awarded_at: 'desc' },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { active_title_id: true },
    });

    return titles.map(t => {
      const def = getTitleById(t.title_id);
      return {
        titleId: t.title_id,
        name: def?.name || '',
        description: def?.description || '',
        icon: def?.icon || '',
        period: t.period as TitlePeriod,
        awardedAt: t.awarded_at.toISOString(),
        expiresAt: t.expires_at?.toISOString() || null,
        isSelected: user?.active_title_id === t.title_id,
      };
    });
  }

  // ==========================================
  // TITLE RECALCULATION
  // ==========================================

  async recalculateTitles(): Promise<void> {
    console.log('[Titles] Recalculando titulos dinamicos...');

    const now = new Date();

    // Calculate period boundaries
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate next period boundaries for expiration
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ==========================================
    // WEEKLY TITLES
    // ==========================================

    // title_lucky: Best win rate this week (min 5 games)
    await this.awardPeriodTitle(
      'title_lucky',
      'WEEKLY',
      weekStart,
      weekEnd,
      `SELECT le.user_id as userId, (le.games_won / le.games_played * 100) as score
       FROM LeaderboardEntry le
       WHERE le.period = 'WEEKLY' AND le.period_start = '${this.formatDateForSQL(weekStart)}'
         AND le.games_played >= 5
       ORDER BY score DESC
       LIMIT 1`
    );

    // title_sharpshooter: Best damage/shots ratio this week
    // Uses GameParticipant data from games this week
    await this.awardPeriodTitle(
      'title_sharpshooter',
      'WEEKLY',
      weekStart,
      weekEnd,
      `SELECT gp.user_id as userId, (SUM(gp.damage_dealt) / GREATEST(SUM(gp.shots_fired), 1)) as score
       FROM GameParticipant gp
       JOIN Game g ON gp.game_id = g.id
       WHERE g.ended_at >= '${this.formatDateForSQL(weekStart)}' AND g.ended_at < '${this.formatDateForSQL(weekEnd)}'
         AND g.status = 'COMPLETED' AND gp.user_id IS NOT NULL
       GROUP BY gp.user_id
       HAVING SUM(gp.shots_fired) >= 5
       ORDER BY score DESC
       LIMIT 1`
    );

    // title_iron_man: Most games this week
    await this.awardPeriodTitle(
      'title_iron_man',
      'WEEKLY',
      weekStart,
      weekEnd,
      `SELECT le.user_id as userId, le.games_played as score
       FROM LeaderboardEntry le
       WHERE le.period = 'WEEKLY' AND le.period_start = '${this.formatDateForSQL(weekStart)}'
       ORDER BY score DESC
       LIMIT 1`
    );

    // ==========================================
    // MONTHLY TITLES
    // ==========================================

    // title_exterminator: Most kills this month
    await this.awardPeriodTitle(
      'title_exterminator',
      'MONTHLY',
      monthStart,
      monthEnd,
      `SELECT gp.user_id as userId, SUM(gp.kills) as score
       FROM GameParticipant gp
       JOIN Game g ON gp.game_id = g.id
       WHERE g.ended_at >= '${this.formatDateForSQL(monthStart)}' AND g.ended_at < '${this.formatDateForSQL(monthEnd)}'
         AND g.status = 'COMPLETED' AND gp.user_id IS NOT NULL
       GROUP BY gp.user_id
       ORDER BY score DESC
       LIMIT 1`
    );

    // title_tank: Most damage taken this month
    await this.awardPeriodTitle(
      'title_tank',
      'MONTHLY',
      monthStart,
      monthEnd,
      `SELECT gp.user_id as userId, SUM(gp.damage_taken) as score
       FROM GameParticipant gp
       JOIN Game g ON gp.game_id = g.id
       WHERE g.ended_at >= '${this.formatDateForSQL(monthStart)}' AND g.ended_at < '${this.formatDateForSQL(monthEnd)}'
         AND g.status = 'COMPLETED' AND gp.user_id IS NOT NULL
       GROUP BY gp.user_id
       ORDER BY score DESC
       LIMIT 1`
    );

    // title_strategist: Most items used this month
    await this.awardPeriodTitle(
      'title_strategist',
      'MONTHLY',
      monthStart,
      monthEnd,
      `SELECT gp.user_id as userId, SUM(gp.items_used) as score
       FROM GameParticipant gp
       JOIN Game g ON gp.game_id = g.id
       WHERE g.ended_at >= '${this.formatDateForSQL(monthStart)}' AND g.ended_at < '${this.formatDateForSQL(monthEnd)}'
         AND g.status = 'COMPLETED' AND gp.user_id IS NOT NULL
       GROUP BY gp.user_id
       ORDER BY score DESC
       LIMIT 1`
    );

    // title_rising_star: Highest ELO gain this month
    await this.awardPeriodTitle(
      'title_rising_star',
      'MONTHLY',
      monthStart,
      monthEnd,
      `SELECT le.user_id as userId, le.elo_gain as score
       FROM LeaderboardEntry le
       WHERE le.period = 'MONTHLY' AND le.period_start = '${this.formatDateForSQL(monthStart)}'
         AND le.elo_gain > 0
       ORDER BY score DESC
       LIMIT 1`
    );

    // ==========================================
    // ALL-TIME TITLES
    // ==========================================

    // title_perfectionist: Highest active win streak
    await this.awardAllTimeTitle(
      'title_perfectionist',
      `SELECT id as userId, current_win_streak as score
       FROM User
       WHERE current_win_streak > 0 AND games_played > 0
       ORDER BY current_win_streak DESC
       LIMIT 1`
    );

    // title_veteran: Most games played total
    await this.awardAllTimeTitle(
      'title_veteran',
      `SELECT id as userId, games_played as score
       FROM User
       WHERE games_played > 0
       ORDER BY games_played DESC
       LIMIT 1`
    );

    // title_champion: Highest ELO rating
    await this.awardAllTimeTitle(
      'title_champion',
      `SELECT id as userId, elo_rating as score
       FROM User
       WHERE games_played > 0
       ORDER BY elo_rating DESC
       LIMIT 1`
    );

    console.log('[Titles] Recalculo de titulos concluido.');
  }

  // ==========================================
  // TITLE HELPERS
  // ==========================================

  private async awardPeriodTitle(
    titleId: string,
    period: 'WEEKLY' | 'MONTHLY',
    periodStart: Date,
    periodEnd: Date,
    query: string
  ): Promise<void> {
    try {
      const results = await prisma.$queryRawUnsafe<{ userId: string; score: number }[]>(query);

      if (results.length === 0 || !results[0].userId) return;

      const winnerId = results[0].userId;

      // Deactivate previous holders of this title for this period
      await prisma.userTitle.updateMany({
        where: {
          title_id: titleId,
          period,
          is_active: true,
        },
        data: { is_active: false },
      });

      // Award to new winner
      await prisma.userTitle.create({
        data: {
          user_id: winnerId,
          title_id: titleId,
          period,
          expires_at: periodEnd,
          is_active: true,
        },
      });

      const def = getTitleById(titleId);
      console.log(`[Titles] ${def?.name || titleId} -> ${winnerId}`);
    } catch (error) {
      console.error(`[Titles] Erro ao recalcular ${titleId}:`, error);
    }
  }

  private async awardAllTimeTitle(
    titleId: string,
    query: string
  ): Promise<void> {
    try {
      const results = await prisma.$queryRawUnsafe<{ userId: string; score: number }[]>(query);

      if (results.length === 0 || !results[0].userId) return;

      const winnerId = results[0].userId;

      // Check if this user already holds this title
      const existing = await prisma.userTitle.findFirst({
        where: {
          title_id: titleId,
          user_id: winnerId,
          period: 'ALL_TIME',
          is_active: true,
        },
      });

      if (existing) return; // Already holds it

      // Deactivate previous holder
      await prisma.userTitle.updateMany({
        where: {
          title_id: titleId,
          period: 'ALL_TIME',
          is_active: true,
        },
        data: { is_active: false },
      });

      // Award to new winner
      await prisma.userTitle.create({
        data: {
          user_id: winnerId,
          title_id: titleId,
          period: 'ALL_TIME',
          expires_at: null,
          is_active: true,
        },
      });

      const def = getTitleById(titleId);
      console.log(`[Titles] ${def?.name || titleId} -> ${winnerId}`);
    } catch (error) {
      console.error(`[Titles] Erro ao recalcular ${titleId}:`, error);
    }
  }

  private formatDateForSQL(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }
}

export const achievementService = new AchievementService();
export type { PlayerEndGameStats };
