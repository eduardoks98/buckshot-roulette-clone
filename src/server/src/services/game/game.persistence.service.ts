// ==========================================
// GAME PERSISTENCE SERVICE
// ==========================================

import { PrismaClient, GameStatus } from '@prisma/client';
import { leaderboardService } from '../leaderboard.service';
import {
  calculatePerformanceBasedElo,
  EloCalculationInput,
  getRankFromElo,
} from '../../../../shared/utils/eloCalculator';

const prisma = new PrismaClient();

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
          roomCode: params.roomCode,
          status: GameStatus.WAITING,
          hasPassword: params.hasPassword,
          maxPlayers: params.maxPlayers || 4,
          participants: {
            create: {
              userId: params.hostUserId || null,
              guestName: params.hostUserId ? null : params.hostGuestName,
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
          gameId: params.gameId,
          userId: params.userId || null,
          guestName: params.userId ? null : params.guestName,
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
        where: { roomCode },
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
        where: { roomCode },
        data: {
          status: GameStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      console.log(`[DB] Jogo iniciado: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao iniciar jogo:', error);
    }
  }

  // End a game and update stats
  async endGame(params: EndGameParams): Promise<void> {
    const { roomCode, winnerUserId, playerStats } = params;

    try {
      // Update game status
      const game = await prisma.game.update({
        where: { roomCode },
        data: {
          status: GameStatus.COMPLETED,
          winnerId: winnerUserId,
          endedAt: new Date(),
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  eloRating: true,
                },
              },
            },
          },
        },
      });

      // Coletar ELOs de todos os jogadores para cálculo
      const playersElos: number[] = game.participants.map(p =>
        p.user?.eloRating || 1000
      );
      const totalPlayers = game.participants.length;

      // Calcular contexto do jogo para o cálculo de performance
      const gameContext = {
        totalPlayers,
        totalKills: playerStats.reduce((sum, p) => sum + p.kills, 0),
        totalDamage: playerStats.reduce((sum, p) => sum + p.damageDealt, 0),
        totalRounds: game.currentRound,
      };

      // Update each participant with their stats
      for (const stats of playerStats) {
        // Find participant by odUserId
        const participant = game.participants.find(
          p => stats.odUserId && p.userId === stats.odUserId
        );

        if (participant && participant.userId) {
          const isWinner = participant.userId === winnerUserId;
          const playerElo = participant.user?.eloRating || 1000;

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
              totalRounds: game.currentRound,
              itemsUsed: stats.itemsUsed,
              shotsFired: stats.shotsFired,
            },
            gameContext,
          };

          // Calcular ELO com performance
          const eloResult = calculatePerformanceBasedElo(eloInput);
          const eloChange = eloResult.totalChange;

          // Update participant stats with eloChange
          await prisma.gameParticipant.update({
            where: { id: participant.id },
            data: {
              position: stats.position,
              roundsWon: stats.roundsWon,
              kills: stats.kills,
              deaths: stats.deaths,
              itemsUsed: stats.itemsUsed,
              damageDealt: stats.damageDealt,
              damageTaken: stats.damageTaken,
              selfDamage: stats.selfDamage,
              shotsFired: stats.shotsFired,
              eloChange: eloChange,
            },
          });

          // Calcular novo ELO e rank
          const newElo = playerElo + eloChange;
          const newRank = getRankFromElo(newElo);

          // Atualizar User com ELO, rank e stats
          await prisma.user.update({
            where: { id: participant.userId },
            data: {
              gamesPlayed: { increment: 1 },
              gamesWon: isWinner ? { increment: 1 } : undefined,
              roundsPlayed: { increment: game.currentRound },
              roundsWon: { increment: stats.roundsWon },
              totalKills: { increment: stats.kills },
              totalDeaths: { increment: stats.deaths },
              eloRating: newElo,
              rank: newRank,
            },
          });

          // Atualizar leaderboard com ELO real
          await leaderboardService.updatePlayerStats(participant.userId, {
            gamesPlayed: 1,
            gamesWon: isWinner ? 1 : 0,
            eloChange: eloChange,
          });

          // Log detalhado do cálculo de ELO
          console.log(`[ELO] ${participant.userId}: ${playerElo} -> ${playerElo + eloChange} (base: ${eloResult.baseChange}, perf: ${eloResult.performanceModifier >= 0 ? '+' : ''}${eloResult.performanceModifier}, score: ${(eloResult.performanceScore * 100).toFixed(0)}%)`);
        }
      }

      console.log(`[DB] Jogo finalizado com stats: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao finalizar jogo:', error);
    }
  }

  // Save a round result
  async saveRound(params: SaveRoundParams): Promise<void> {
    const { roomCode, roundNumber, maxHp, shellsLive, shellsBlank, winnerId } = params;

    try {
      const game = await prisma.game.findUnique({
        where: { roomCode },
      });

      if (!game) {
        console.error(`[DB] Jogo nao encontrado: ${roomCode}`);
        return;
      }

      await prisma.round.create({
        data: {
          gameId: game.id,
          roundNumber,
          maxHp,
          shellsLive,
          shellsBlank,
          winnerId, // Socket ID do vencedor
        },
      });

      // Update game currentRound
      await prisma.game.update({
        where: { roomCode },
        data: {
          currentRound: roundNumber,
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
        where: { roomCode },
      });

      if (!game) return;

      await prisma.round.updateMany({
        where: {
          gameId: game.id,
          roundNumber,
        },
        data: {
          winnerId,
          endedAt: new Date(),
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
        where: { roomCode },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                  eloRating: true,
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
            gameId,
            userId: odUserId,
          },
        });
      } else if (guestName) {
        await prisma.gameParticipant.deleteMany({
          where: {
            gameId,
            guestName,
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
        where: { roomCode },
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
        where: { roomCode },
        data: {
          status: GameStatus.ABANDONED,
          endedAt: new Date(),
        },
      });

      console.log(`[DB] Jogo abandonado: ${roomCode}`);
    } catch (error) {
      console.error('[DB] Erro ao abandonar jogo:', error);
    }
  }
}

export const gamePersistenceService = new GamePersistenceService();
