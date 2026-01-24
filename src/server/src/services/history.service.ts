// ==========================================
// HISTORY SERVICE
// Serviço para buscar histórico de partidas
// ==========================================

import { PrismaClient, GameStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// TYPES
// ==========================================

export interface GameHistoryEntry {
  id: string;
  roomCode: string;
  status: GameStatus;
  createdAt: Date;
  endedAt: Date | null;
  totalRounds: number;

  // Resultado do usuário
  position: number | null;
  roundsWon: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  selfDamage: number;
  shotsFired: number;
  itemsUsed: number;
  eloChange: number | null;

  // Oponentes
  opponents: {
    displayName: string;
    position: number | null;
    eloRating: number;
  }[];

  // Vencedor
  winner: {
    id: string;
    displayName: string;
  } | null;
}

export interface GameDetailedHistory extends GameHistoryEntry {
  rounds: {
    roundNumber: number;
    winnerId: string | null;
    maxHp: number;
    shellsLive: number;
    shellsBlank: number;
    startedAt: Date;
    endedAt: Date | null;
  }[];

  // Stats completas de todos os participantes
  participants: {
    odUserId: string | null;
    displayName: string;
    position: number | null;
    roundsWon: number;
    kills: number;
    deaths: number;
    damageDealt: number;
    damageTaken: number;
    selfDamage: number;
    shotsFired: number;
    itemsUsed: number;
    eloChange: number | null;
    eloRating: number | null;
  }[];
}

export interface UserGameStats {
  recentForm: ('W' | 'L')[];
  averagePosition: number;
  averageDamageDealt: number;
  averageKills: number;
  bestStreak: number;
  currentStreak: number;
  totalGames: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

class HistoryService {
  /**
   * Buscar histórico paginado de partidas do usuário
   */
  async getUserHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<GameHistoryEntry>> {
    try {
      const skip = (page - 1) * limit;

      // Buscar total de partidas do usuário
      const total = await prisma.gameParticipant.count({
        where: {
          userId,
          game: {
            status: {
              in: [GameStatus.COMPLETED, GameStatus.ABANDONED],
            },
          },
        },
      });

      // Buscar partidas com paginação
      const participations = await prisma.gameParticipant.findMany({
        where: {
          userId,
          game: {
            status: {
              in: [GameStatus.COMPLETED, GameStatus.ABANDONED],
            },
          },
        },
        include: {
          game: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      displayName: true,
                      eloRating: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          game: {
            endedAt: 'desc',
          },
        },
        skip,
        take: limit,
      });

      // Mapear para o formato de retorno
      const games: GameHistoryEntry[] = participations.map(participation => {
        const game = participation.game;

        // Encontrar oponentes (outros participantes)
        const opponents = game.participants
          .filter(p => p.userId !== userId)
          .map(p => ({
            displayName: p.user?.displayName || 'Jogador',
            position: p.position,
            eloRating: p.user?.eloRating || 1000,
          }));

        // Encontrar vencedor
        const winnerParticipant = game.participants.find(p => p.position === 1);
        const winner = winnerParticipant?.user
          ? {
              id: winnerParticipant.user.id,
              displayName: winnerParticipant.user.displayName,
            }
          : null;

        return {
          id: game.id,
          roomCode: game.roomCode,
          status: game.status,
          createdAt: game.createdAt,
          endedAt: game.endedAt,
          totalRounds: game.currentRound,
          position: participation.position,
          roundsWon: participation.roundsWon,
          kills: participation.kills,
          deaths: participation.deaths,
          damageDealt: participation.damageDealt,
          damageTaken: participation.damageTaken,
          selfDamage: participation.selfDamage,
          shotsFired: participation.shotsFired,
          itemsUsed: participation.itemsUsed,
          eloChange: participation.eloChange,
          opponents,
          winner,
        };
      });

      return {
        data: games,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('[History] Erro ao buscar histórico:', error);
      throw error;
    }
  }

  /**
   * Buscar detalhes completos de uma partida específica
   */
  async getGameDetails(
    gameId: string,
    userId: string
  ): Promise<GameDetailedHistory | null> {
    try {
      // Verificar se o usuário participou da partida
      const participation = await prisma.gameParticipant.findFirst({
        where: {
          gameId,
          userId,
        },
      });

      if (!participation) {
        return null; // Usuário não participou desta partida
      }

      // Buscar dados completos da partida
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  eloRating: true,
                },
              },
            },
          },
          rounds: {
            orderBy: {
              roundNumber: 'asc',
            },
          },
        },
      });

      if (!game) {
        return null;
      }

      // Encontrar participação do usuário
      const userParticipation = game.participants.find(p => p.userId === userId);
      if (!userParticipation) {
        return null;
      }

      // Mapear oponentes
      const opponents = game.participants
        .filter(p => p.userId !== userId)
        .map(p => ({
          displayName: p.user?.displayName || 'Jogador',
          position: p.position,
          eloRating: p.user?.eloRating || 1000,
        }));

      // Encontrar vencedor
      const winnerParticipant = game.participants.find(p => p.position === 1);
      const winner = winnerParticipant?.user
        ? {
            id: winnerParticipant.user.id,
            displayName: winnerParticipant.user.displayName,
          }
        : null;

      // Mapear participantes
      const participants = game.participants.map(p => ({
        odUserId: p.userId,
        displayName: p.user?.displayName || 'Jogador',
        position: p.position,
        roundsWon: p.roundsWon,
        kills: p.kills,
        deaths: p.deaths,
        damageDealt: p.damageDealt,
        damageTaken: p.damageTaken,
        selfDamage: p.selfDamage,
        shotsFired: p.shotsFired,
        itemsUsed: p.itemsUsed,
        eloChange: p.eloChange,
        eloRating: p.user?.eloRating || null,
      }));

      // Mapear rounds
      const rounds = game.rounds.map(r => ({
        roundNumber: r.roundNumber,
        winnerId: r.winnerId,
        maxHp: r.maxHp,
        shellsLive: r.shellsLive,
        shellsBlank: r.shellsBlank,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
      }));

      return {
        id: game.id,
        roomCode: game.roomCode,
        status: game.status,
        createdAt: game.createdAt,
        endedAt: game.endedAt,
        totalRounds: game.currentRound,
        position: userParticipation.position,
        roundsWon: userParticipation.roundsWon,
        kills: userParticipation.kills,
        deaths: userParticipation.deaths,
        damageDealt: userParticipation.damageDealt,
        damageTaken: userParticipation.damageTaken,
        selfDamage: userParticipation.selfDamage,
        shotsFired: userParticipation.shotsFired,
        itemsUsed: userParticipation.itemsUsed,
        eloChange: userParticipation.eloChange,
        opponents,
        winner,
        rounds,
        participants,
      };
    } catch (error) {
      console.error('[History] Erro ao buscar detalhes:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas resumidas do usuário
   */
  async getUserStats(userId: string): Promise<UserGameStats> {
    try {
      // Buscar últimas 10 partidas para calcular forma recente
      const recentGames = await prisma.gameParticipant.findMany({
        where: {
          userId,
          game: {
            status: GameStatus.COMPLETED,
          },
        },
        select: {
          position: true,
          kills: true,
          damageDealt: true,
          game: {
            select: {
              participants: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
        orderBy: {
          game: {
            endedAt: 'desc',
          },
        },
        take: 20, // Buscar mais para calcular streak
      });

      // Calcular forma recente (últimas 10 partidas)
      const recentForm: ('W' | 'L')[] = recentGames
        .slice(0, 10)
        .map(g => (g.position === 1 ? 'W' : 'L'));

      // Calcular média de posição
      const positions = recentGames
        .filter(g => g.position !== null)
        .map(g => g.position as number);
      const averagePosition = positions.length > 0
        ? positions.reduce((a, b) => a + b, 0) / positions.length
        : 0;

      // Calcular média de dano
      const averageDamageDealt = recentGames.length > 0
        ? recentGames.reduce((a, b) => a + b.damageDealt, 0) / recentGames.length
        : 0;

      // Calcular média de kills
      const averageKills = recentGames.length > 0
        ? recentGames.reduce((a, b) => a + b.kills, 0) / recentGames.length
        : 0;

      // Calcular streaks
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < recentGames.length; i++) {
        if (recentGames[i].position === 1) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 0;
          if (i === 0) currentStreak = 0;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);

      // Total de partidas
      const totalGames = await prisma.gameParticipant.count({
        where: {
          userId,
          game: {
            status: GameStatus.COMPLETED,
          },
        },
      });

      return {
        recentForm,
        averagePosition: Math.round(averagePosition * 10) / 10,
        averageDamageDealt: Math.round(averageDamageDealt * 10) / 10,
        averageKills: Math.round(averageKills * 10) / 10,
        bestStreak,
        currentStreak,
        totalGames,
      };
    } catch (error) {
      console.error('[History] Erro ao buscar stats:', error);
      throw error;
    }
  }
}

export const historyService = new HistoryService();
