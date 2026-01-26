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
import { PlayerXpResult } from '../../../../shared/types/achievement.types';

// ==========================================
// TYPES
// ==========================================

interface CreateGameParams {
  roomCode: string;
  hostUserId?: string;
  hostGuestName?: string;
  hasPassword: boolean;
  maxPlayers?: number;
}

interface AddParticipantParams {
  gameId: string;
  userId?: string;
  guestName?: string;
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
          participants: {
            create: {
              user_id: params.hostUserId || null,
              guest_name: params.hostUserId ? null : params.hostGuestName,
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

  // Add a participant to the game
  async addParticipant(params: AddParticipantParams): Promise<string | null> {
    try {
      const participant = await prisma.gameParticipant.create({
        data: {
          game_id: params.gameId,
          user_id: params.userId || null,
          guest_name: params.userId ? null : params.guestName,
        },
      });

      console.log(`[DB] Participante adicionado: ${participant.id}`);
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
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  elo_rating: true,
                },
              },
            },
          },
        },
      });

      // Coletar ELOs de todos os jogadores para cálculo
      const playersElos: number[] = game.participants.map(p =>
        p.user?.elo_rating || 1000
      );
      const totalPlayers = game.participants.length;

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
        const participant = game.participants.find(
          p => stats.odUserId && p.user_id === stats.odUserId
        );

        if (participant && participant.user_id) {
          const isWinner = participant.user_id === winnerUserId;
          const playerElo = participant.user?.elo_rating || 1000;

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

          // Calcular ELO com performance
          const eloResult = calculatePerformanceBasedElo(eloInput);
          const eloChange = eloResult.totalChange;

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

          // Update participant stats with eloChange + xpEarned
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
            },
          });

          // Calcular novo ELO e rank
          const newElo = playerElo + eloChange;
          const newRank = getRankFromElo(newElo);

          // Atualizar User com ELO, rank, stats e XP
          await prisma.user.update({
            where: { id: participant.user_id },
            data: {
              games_played: { increment: 1 },
              games_won: isWinner ? { increment: 1 } : undefined,
              rounds_played: { increment: game.current_round },
              rounds_won: { increment: stats.roundsWon },
              total_kills: { increment: stats.kills },
              total_deaths: { increment: stats.deaths },
              elo_rating: newElo,
              rank: newRank,
              total_xp: { increment: xpResult.totalXp },
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
          });

          // Log detalhado do cálculo de ELO e XP
          console.log(`[ELO] ${participant.user_id}: ${playerElo} -> ${playerElo + eloChange} (base: ${eloResult.baseChange}, perf: ${eloResult.performanceModifier >= 0 ? '+' : ''}${eloResult.performanceModifier}, score: ${(eloResult.performanceScore * 100).toFixed(0)}%)`);
          console.log(`[XP] ${participant.user_id}: +${xpResult.totalXp} XP (total: ${newTotalXp}, lvl ${newLevelInfo.displayLevel} P${newLevelInfo.prestigeLevel})`);
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
          participants: {
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
    participants: Array<{
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
          participants: {
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
        participants: game.participants.map(p => ({
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
