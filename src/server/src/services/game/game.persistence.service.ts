// ==========================================
// GAME PERSISTENCE SERVICE
// ==========================================

import { GameStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { leaderboardService } from '../leaderboard.service';
import {
  calculatePerformanceBasedElo,
  EloCalculationInput,
  getRankFromElo,
} from '../../../../shared/utils/eloCalculator';
import {
  calculateXpGain,
  getLevelInfo,
} from '../../../../shared/utils/xpCalculator';
import {
  calculateLpChange,
  calculatePerformanceScore,
  getDisplayRank,
  RankingInput,
  Tier,
} from '../../../../shared/utils/rankingCalculator';
import { PlayerXpResult } from '../../../../shared/types/achievement.types';

// ==========================================
// TYPES
// ==========================================

interface CreateGameParams {
  roomCode: string;
  hostUserId?: string;
  hostGuestName?: string;
  hostSocketId?: string;  // Socket ID do host para correlação
  hasPassword: boolean;
  maxPlayers?: number;
}

interface AddParticipantParams {
  gameId: string;
  userId?: string;
  guestName?: string;
  odId?: string;  // Socket ID or Bot ID (para correlacionar com stats no endGame)
}

interface PlayerGameStats {
  odId: string;  // Socket ID
  odUserId?: string;  // User ID if logged in
  guestName?: string;
  roundsWon: number;
  position: number;
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  kills: number;
  deaths: number;
}

interface EndGameParams {
  roomCode: string;
  winnerId?: string; // participant socket ID
  winnerUserId?: string; // actual user ID if logged in
  playerStats: PlayerGameStats[];
}

interface SaveRoundParams {
  roomCode: string;
  roundNumber: number;
  maxHp: number;
  shellsLive: number;
  shellsBlank: number;
  winnerId?: string; // socket ID of round winner
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class GamePersistenceService {
  // Create a new game in database
  async createGame(params: CreateGameParams): Promise<string> {
    try {
      const game = await prisma.game.create({
        data: {
          room_code: params.roomCode,
          status: GameStatus.WAITING,
          has_password: params.hasPassword,
          max_players: params.maxPlayers || 4,
          game_participants: {
            create: {
              user_id: params.hostUserId || null,
              guest_name: params.hostUserId ? null : params.hostGuestName,
              socket_id: params.hostSocketId,  // Salvar socket ID do host
            },
          },
        },
      });

      console.log(`[DB] Jogo criado: ${game.id} (${params.roomCode})`);
      return game.id;
    } catch (error) {
      console.error('[DB] Erro ao criar jogo:', error);
      throw error;
    }
  }

  // Add a participant to the game (or update if already exists)
  async addParticipant(params: AddParticipantParams): Promise<string | null> {
    try {
      // Para usuários logados, usar upsert para evitar erro de constraint
      if (params.userId) {
        const participant = await prisma.gameParticipant.upsert({
          where: {
            game_id_user_id: {
              game_id: params.gameId,
              user_id: params.userId,
            },
          },
          create: {
            game_id: params.gameId,
            user_id: params.userId,
            guest_name: null,
            socket_id: params.odId,  // Salvar socket ID para correlação
          },
          update: {
            socket_id: params.odId,  // Atualizar socket ID na reconexão
          },
        });

        console.log(`[DB] Participante adicionado/atualizado: ${participant.id}`);
        return participant.id;
      }

      // Para guests/bots, usar create normal (não têm user_id para constraint)
      const participant = await prisma.gameParticipant.create({
        data: {
          game_id: params.gameId,
          user_id: null,
          guest_name: params.guestName,
          socket_id: params.odId,  // Salvar socket ID para correlação
        },
      });

      console.log(`[DB] Participante guest/bot adicionado: ${participant.id} (socket: ${params.odId})`);
      return participant.id;
    } catch (error) {
      console.error('[DB] Erro ao adicionar participante:', error);
      return null;
    }
  }

  // Get game ID by room code
  async getGameId(roomCode: string): Promise<string | null> {
    try {
      const game = await prisma.game.findUnique({
        where: { room_code: roomCode },
        select: { id: true },
      });
      return game?.id || null;
    } catch (error) {
      console.error('[DB] Erro ao buscar gameId:', error);
      return null;
    }
  }

  // Start a game (change status to IN_PROGRESS)
  async startGame(roomCode: string): Promise<void> {
    try {
      await prisma.game.update({
        where: { room_code: roomCode },
        data: {
          status: GameStatus.IN_PROGRESS,
          started_at: new Date(),
        },
      });

      console.log(`[DB] Jogo iniciado: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao iniciar jogo:', error);
    }
  }

  // End a game and update stats
  async endGame(params: EndGameParams): Promise<{ gameId: string; xpResults: PlayerXpResult[] } | null> {
    const { roomCode, winnerUserId, playerStats } = params;
    const xpResults: PlayerXpResult[] = [];

    try {
      // Update game status
      const game = await prisma.game.update({
        where: { room_code: roomCode },
        data: {
          status: GameStatus.COMPLETED,
          winner_id: winnerUserId,
          ended_at: new Date(),
        },
        include: {
          game_participants: {
            include: {
              user: {
                select: {
                  id: true,
                  elo_rating: true,
                  // Novo sistema de ranking
                  tier: true,
                  division: true,
                  lp: true,
                  mmr_hidden: true,
                  games_since_promo: true,
                },
              },
            },
          },
        },
      });

      // Coletar ELOs de todos os jogadores para cálculo (legacy)
      const playersElos: number[] = game.game_participants.map(p =>
        p.user?.elo_rating || 0
      );

      // Coletar MMRs para novo sistema de ranking
      const playersMmrs: number[] = game.game_participants.map(p =>
        p.user?.mmr_hidden || 800
      );

      const totalPlayers = game.game_participants.length;

      // Calcular contexto do jogo para o cálculo de performance
      const gameContext = {
        totalPlayers,
        totalKills: playerStats.reduce((sum, p) => sum + p.kills, 0),
        totalDamage: playerStats.reduce((sum, p) => sum + p.damageDealt, 0),
        totalRounds: game.current_round,
      };

      // Update each participant with their stats
      for (const stats of playerStats) {
        // Find participant by odUserId
        const participant = game.game_participants.find(
          p => stats.odUserId && p.user_id === stats.odUserId
        );

        if (participant && participant.user_id) {
          const isWinner = participant.user_id === winnerUserId;
          const playerElo = participant.user?.elo_rating || 0;

          // Preparar input para cálculo de ELO com performance
          const eloInput: EloCalculationInput = {
            playerElo,
            allPlayersElo: playersElos,
            playerPosition: stats.position,
            totalPlayers,
            performance: {
              damageDealt: stats.damageDealt,
              damageTaken: stats.damageTaken,
              selfDamage: stats.selfDamage,
              kills: stats.kills,
              deaths: stats.deaths,
              roundsWon: stats.roundsWon,
              totalRounds: game.current_round,
              itemsUsed: stats.itemsUsed,
              shotsFired: stats.shotsFired,
            },
            gameContext,
          };

          // Calcular ELO com performance (legacy)
          const eloResult = calculatePerformanceBasedElo(eloInput);
          const eloChange = eloResult.totalChange;

          // ========================================
          // NOVO SISTEMA DE RANKING (LP + MMR)
          // ========================================

          // Calcular performance score para o novo sistema
          const performanceScore = calculatePerformanceScore({
            kills: stats.kills,
            deaths: stats.deaths,
            roundsWon: stats.roundsWon,
            totalRounds: game.current_round,
            damageDealt: stats.damageDealt,
            damageTaken: stats.damageTaken,
            itemsUsed: stats.itemsUsed,
          });

          // Preparar input para novo ranking
          const rankingInput: RankingInput = {
            currentTier: participant.user?.tier || 'Bronze',
            currentDivision: participant.user?.division ?? 4,
            currentLp: participant.user?.lp || 0,
            currentMmr: participant.user?.mmr_hidden || 800,
            gamesSincePromo: participant.user?.games_since_promo || 0,
            position: stats.position,
            totalPlayers,
            allPlayersMmr: playersMmrs,
            performanceScore,
            wasQuitter: false, // TODO: detectar quitters
          };

          // Calcular novo LP/MMR
          const rankingResult = calculateLpChange(rankingInput);

          // Calculate XP
          const currentUser = await prisma.user.findUnique({
            where: { id: participant.user_id },
            select: { total_xp: true },
          });
          const currentTotalXp = currentUser?.total_xp || 0;
          const previousLevelInfo = getLevelInfo(currentTotalXp);

          const xpResult = calculateXpGain({
            position: stats.position,
            totalPlayers,
            kills: stats.kills,
            roundsWon: stats.roundsWon,
            totalRounds: game.current_round,
            damageDealt: stats.damageDealt,
            itemsUsed: stats.itemsUsed,
            selfDamage: stats.selfDamage,
            deaths: stats.deaths,
            prestigeLevel: previousLevelInfo.prestigeLevel,
          });

          const newTotalXp = currentTotalXp + xpResult.totalXp;
          const newLevelInfo = getLevelInfo(newTotalXp);

          // Update participant stats with eloChange, xpEarned, lpChange, mmrChange
          await prisma.gameParticipant.update({
            where: { id: participant.id },
            data: {
              position: stats.position,
              rounds_won: stats.roundsWon,
              kills: stats.kills,
              deaths: stats.deaths,
              items_used: stats.itemsUsed,
              damage_dealt: stats.damageDealt,
              damage_taken: stats.damageTaken,
              self_damage: stats.selfDamage,
              shots_fired: stats.shotsFired,
              elo_change: eloChange,
              xp_earned: xpResult.totalXp,
              lp_change: rankingResult.lpChange,
              mmr_change: rankingResult.mmrChange,
            },
          });

          // Calcular novo ELO e rank (legacy)
          const newElo = playerElo + eloChange;
          const newRank = getRankFromElo(newElo);

          // Calcular games_since_promo
          let newGamesSincePromo = (participant.user?.games_since_promo || 0) + 1;
          if (rankingResult.promoted || rankingResult.demoted) {
            newGamesSincePromo = 0; // Reset após promoção/rebaixamento
          }

          // Atualizar User com ELO, rank, stats, XP e NOVO SISTEMA DE RANKING
          await prisma.user.update({
            where: { id: participant.user_id },
            data: {
              games_played: { increment: 1 },
              games_won: isWinner ? { increment: 1 } : undefined,
              rounds_played: { increment: game.current_round },
              rounds_won: { increment: stats.roundsWon },
              total_kills: { increment: stats.kills },
              total_deaths: { increment: stats.deaths },
              // Legacy ELO
              elo_rating: newElo,
              rank: newRank,
              // XP
              total_xp: { increment: xpResult.totalXp },
              // Novo sistema de ranking
              tier: rankingResult.newTier,
              division: rankingResult.newDivision,
              lp: rankingResult.newLp,
              mmr_hidden: rankingResult.newMmr,
              peak_mmr: Math.max(participant.user?.mmr_hidden || 800, rankingResult.newMmr),
              games_since_promo: newGamesSincePromo,
            },
          });

          // Atualizar leaderboard com ELO real
          await leaderboardService.updatePlayerStats(participant.user_id, {
            games_played: 1,
            games_won: isWinner ? 1 : 0,
            elo_change: eloChange,
          });

          // Store XP result for returning to handler
          xpResults.push({
            odId: stats.odId,
            odUserId: participant.user_id,
            xpEarned: xpResult.totalXp,
            newTotalXp: newTotalXp,
            previousLevel: previousLevelInfo.displayLevel,
            newLevel: newLevelInfo.displayLevel,
            previousPrestige: previousLevelInfo.prestigeLevel,
            newPrestige: newLevelInfo.prestigeLevel,
            breakdown: xpResult.breakdown,
            // Legacy ELO
            eloChange: eloChange,
            newEloRating: newElo,
            // Novo sistema de ranking
            lpChange: rankingResult.lpChange,
            newLp: rankingResult.newLp,
            mmrChange: rankingResult.mmrChange,
            newMmr: rankingResult.newMmr,
            newTier: rankingResult.newTier,
            newDivision: rankingResult.newDivision,
            displayRank: rankingResult.displayRank,
            promoted: rankingResult.promoted,
            demoted: rankingResult.demoted,
          });

          // Log detalhado do cálculo de ELO, LP e XP
          console.log(`[ELO] ${participant.user_id}: ${playerElo} -> ${newElo} (${eloChange >= 0 ? '+' : ''}${eloChange})`);
          console.log(`[LP] ${participant.user_id}: ${rankingResult.displayRank} (${rankingResult.lpChange >= 0 ? '+' : ''}${rankingResult.lpChange} LP, LP: ${rankingResult.newLp}/100)${rankingResult.promoted ? ' PROMOVIDO!' : ''}${rankingResult.demoted ? ' REBAIXADO!' : ''}`);
          console.log(`[XP] ${participant.user_id}: +${xpResult.totalXp} XP (total: ${newTotalXp}, lvl ${newLevelInfo.displayLevel} P${newLevelInfo.prestigeLevel})`);
        } else {
          // ========================================
          // PROCESSAR GUEST/BOT (sem user_id)
          // ========================================
          // Tentar encontrar pelo socket_id (odId)
          const guestParticipant = game.game_participants.find(
            p => !p.user_id && p.socket_id === stats.odId
          );

          if (guestParticipant) {
            // Atualizar stats do guest/bot (sem ELO/XP pois não tem conta)
            await prisma.gameParticipant.update({
              where: { id: guestParticipant.id },
              data: {
                position: stats.position,
                rounds_won: stats.roundsWon,
                kills: stats.kills,
                deaths: stats.deaths,
                items_used: stats.itemsUsed,
                damage_dealt: stats.damageDealt,
                damage_taken: stats.damageTaken,
                self_damage: stats.selfDamage,
                shots_fired: stats.shotsFired,
              },
            });

            console.log(`[DB] Stats de guest/bot atualizadas: ${guestParticipant.guest_name} (${stats.odId})`);
          } else {
            console.warn(`[DB] Participante não encontrado para stats: odId=${stats.odId}, odUserId=${stats.odUserId}`);
          }
        }
      }

      console.log(`[DB] Jogo finalizado com stats: ${roomCode}`);
      return { gameId: game.id, xpResults };
    } catch (error) {
      console.error('[DB] Erro ao finalizar jogo:', error);
      return null;
    }
  }

  // Save a round result
  async saveRound(params: SaveRoundParams): Promise<void> {
    const { roomCode, roundNumber, maxHp, shellsLive, shellsBlank, winnerId } = params;

    try {
      const game = await prisma.game.findUnique({
        where: { room_code: roomCode },
      });

      if (!game) {
        console.error(`[DB] Jogo nao encontrado: ${roomCode}`);
        return;
      }

      await prisma.round.create({
        data: {
          game_id: game.id,
          round_number: roundNumber,
          max_hp: maxHp,
          shells_live: shellsLive,
          shells_blank: shellsBlank,
          winner_id: winnerId, // Socket ID do vencedor
        },
      });

      // Update game currentRound
      await prisma.game.update({
        where: { room_code: roomCode },
        data: {
          current_round: roundNumber,
        },
      });

      console.log(`[DB] Round ${roundNumber} salvo: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao salvar round:', error);
    }
  }

  // End a round (update round with winner and endedAt)
  async endRound(roomCode: string, roundNumber: number, winnerId: string): Promise<void> {
    try {
      const game = await prisma.game.findUnique({
        where: { room_code: roomCode },
      });

      if (!game) return;

      await prisma.round.updateMany({
        where: {
          game_id: game.id,
          round_number: roundNumber,
        },
        data: {
          winner_id: winnerId,
          ended_at: new Date(),
        },
      });

      console.log(`[DB] Round ${roundNumber} finalizado: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao finalizar round:', error);
    }
  }

  // Get game by room code
  async getGameByRoomCode(roomCode: string) {
    try {
      return await prisma.game.findUnique({
        where: { room_code: roomCode },
        include: {
          game_participants: {
            include: {
              user: {
                select: {
                  id: true,
                  display_name: true,
                  avatar_url: true,
                  elo_rating: true,
                  rank: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('[DB] Erro ao buscar jogo:', error);
      return null;
    }
  }

  // Remove participant (when leaving before game starts)
  async removeParticipant(gameId: string, odUserId?: string, guestName?: string): Promise<void> {
    try {
      if (odUserId) {
        await prisma.gameParticipant.deleteMany({
          where: {
            game_id: gameId,
            user_id: odUserId,
          },
        });
      } else if (guestName) {
        await prisma.gameParticipant.deleteMany({
          where: {
            game_id: gameId,
            guest_name: guestName,
          },
        });
      }

      console.log(`[DB] Participante removido do jogo ${gameId}`);
    } catch (error) {
      console.error('[DB] Erro ao remover participante:', error);
    }
  }

  // Delete game (when room is empty)
  async deleteGame(roomCode: string): Promise<void> {
    try {
      await prisma.game.delete({
        where: { room_code: roomCode },
      });

      console.log(`[DB] Jogo deletado: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao deletar jogo:', error);
    }
  }

  // Abandon game (when game is interrupted)
  async abandonGame(roomCode: string): Promise<void> {
    try {
      await prisma.game.update({
        where: { room_code: roomCode },
        data: {
          status: GameStatus.ABANDONED,
          ended_at: new Date(),
        },
      });

      console.log(`[DB] Jogo abandonado: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao abandonar jogo:', error);
    }
  }

  // ==========================================
  // GAME STATE SNAPSHOT (for crash recovery)
  // ==========================================

  // Save full game state snapshot (chamado após cada ação)
  async saveGameState(roomCode: string, gameState: object): Promise<void> {
    try {
      await prisma.game.update({
        where: { room_code: roomCode },
        data: {
          game_state: JSON.stringify(gameState),
          game_state_updated_at: new Date(),
        },
      });
      // Log silencioso para não poluir
    } catch (error) {
      console.error('[DB] Erro ao salvar estado do jogo:', error);
    }
  }

  // Get all in-progress games for server recovery
  async getInProgressGames(): Promise<Array<{
    roomCode: string;
    gameState: object | null;
    game_participants: Array<{
      odUserId: string | null;
      guestName: string | null;
      socketId: string | null;
      reconnectToken: string | null;
    }>;
  }>> {
    try {
      const games = await prisma.game.findMany({
        where: {
          status: GameStatus.IN_PROGRESS,
          game_state: { not: null },
        },
        select: {
          room_code: true,
          game_state: true,
          game_participants: {
            select: {
              user_id: true,
              guest_name: true,
              socket_id: true,
              reconnect_token: true,
            },
          },
        },
      });

      return games.map(game => ({
        roomCode: game.room_code,
        gameState: game.game_state ? JSON.parse(game.game_state) : null,
        game_participants: game.game_participants.map(p => ({
          odUserId: p.user_id,
          guestName: p.guest_name,
          socketId: p.socket_id,
          reconnectToken: p.reconnect_token,
        })),
      }));
    } catch (error) {
      console.error('[DB] Erro ao buscar jogos em progresso:', error);
      return [];
    }
  }

  // Update participant socket info (for reconnection tracking)
  async updateParticipantSocket(
    gameId: string,
    odUserId: string | undefined,
    guestName: string | undefined,
    socketId: string,
    reconnectToken: string
  ): Promise<void> {
    try {
      if (odUserId) {
        await prisma.gameParticipant.updateMany({
          where: {
            game_id: gameId,
            user_id: odUserId,
          },
          data: {
            socket_id: socketId,
            reconnect_token: reconnectToken,
          },
        });
      } else if (guestName) {
        await prisma.gameParticipant.updateMany({
          where: {
            game_id: gameId,
            guest_name: guestName,
          },
          data: {
            socket_id: socketId,
            reconnect_token: reconnectToken,
          },
        });
      }
    } catch (error) {
      console.error('[DB] Erro ao atualizar socket do participante:', error);
    }
  }

  // Clear game state (when game ends normally)
  async clearGameState(roomCode: string): Promise<void> {
    try {
      await prisma.game.update({
        where: { room_code: roomCode },
        data: {
          game_state: null,
          game_state_updated_at: null,
        },
      });
    } catch (error) {
      console.error('[DB] Erro ao limpar estado do jogo:', error);
    }
  }
}

export const gamePersistenceService = new GamePersistenceService();
