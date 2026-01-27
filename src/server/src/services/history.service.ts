// ==========================================
// HISTORY SERVICE
// Serviço para buscar histórico de partidas
// ==========================================

import { GameStatus } from '@prisma/client';
import prisma from '../lib/prisma';

// ==========================================
// TYPES
// ==========================================

export interface GameHistoryEntry {
  id: string;
  room_code: string;
  status: GameStatus;
  created_at: Date;
  ended_at: Date | null;
  total_rounds: number;

  // Resultado do usuário
  position: number | null;
  rounds_won: number;
  kills: number;
  deaths: number;
  damage_dealt: number;
  damage_taken: number;
  self_damage: number;
  shots_fired: number;
  items_used: number;
  elo_change: number | null;
  xp_earned: number | null;

  // Oponentes
  opponents: {
    display_name: string;
    position: number | null;
    elo_rating: number;
  }[];

  // Vencedor
  winner: {
    id: string;
    display_name: string;
  } | null;
}

export interface GameDetailedHistory extends GameHistoryEntry {
  rounds: {
    round_number: number;
    winner_id: string | null;
    max_hp: number;
    shells_live: number;
    shells_blank: number;
    started_at: Date;
    ended_at: Date | null;
  }[];

  // Stats completas de todos os participantes
  participants: {
    user_id: string | null;
    display_name: string;
    position: number | null;
    rounds_won: number;
    kills: number;
    deaths: number;
    damage_dealt: number;
    damage_taken: number;
    self_damage: number;
    shots_fired: number;
    items_used: number;
    elo_change: number | null;
    xp_earned: number | null;
    elo_rating: number | null;
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
          user_id: userId,
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
          user_id: userId,
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
                      display_name: true,
                      elo_rating: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          game: {
            ended_at: 'desc',
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
          .filter(p => p.user_id !== userId)
          .map(p => ({
            display_name: p.user?.display_name || p.guest_name || 'Jogador',  // Usar guest_name para bots
            position: p.position,
            elo_rating: p.user?.elo_rating || 1000,
          }));

        // Encontrar vencedor
        const winnerParticipant = game.participants.find(p => p.position === 1);
        const winner = winnerParticipant?.user
          ? {
              id: winnerParticipant.user.id,
              display_name: winnerParticipant.user.display_name,
            }
          : winnerParticipant?.guest_name
            ? {
                id: '',  // Bots não têm ID de usuário
                display_name: winnerParticipant.guest_name,
              }
            : null;

        return {
          id: game.id,
          room_code: game.room_code,
          status: game.status,
          created_at: game.created_at,
          ended_at: game.ended_at,
          total_rounds: game.current_round,
          position: participation.position,
          rounds_won: participation.rounds_won,
          kills: participation.kills,
          deaths: participation.deaths,
          damage_dealt: participation.damage_dealt,
          damage_taken: participation.damage_taken,
          self_damage: participation.self_damage,
          shots_fired: participation.shots_fired,
          items_used: participation.items_used,
          elo_change: participation.elo_change,
          xp_earned: participation.xp_earned,
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
          game_id: gameId,
          user_id: userId,
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
                  display_name: true,
                  elo_rating: true,
                },
              },
            },
          },
          rounds: {
            orderBy: {
              round_number: 'asc',
            },
          },
        },
      });

      if (!game) {
        return null;
      }

      // Encontrar participação do usuário
      const userParticipation = game.participants.find(p => p.user_id === userId);
      if (!userParticipation) {
        return null;
      }

      // Mapear oponentes
      const opponents = game.participants
        .filter(p => p.user_id !== userId)
        .map(p => ({
          display_name: p.user?.display_name || p.guest_name || 'Jogador',  // Usar guest_name para bots
          position: p.position,
          elo_rating: p.user?.elo_rating || 1000,
        }));

      // Encontrar vencedor
      const winnerParticipant = game.participants.find(p => p.position === 1);
      const winner = winnerParticipant?.user
        ? {
            id: winnerParticipant.user.id,
            display_name: winnerParticipant.user.display_name,
          }
        : winnerParticipant?.guest_name
          ? {
              id: '',  // Bots não têm ID de usuário
              display_name: winnerParticipant.guest_name,
            }
          : null;

      // Mapear participantes
      const participants = game.participants.map(p => ({
        user_id: p.user_id,
        display_name: p.user?.display_name || p.guest_name || 'Jogador',  // Usar guest_name para bots
        position: p.position,
        rounds_won: p.rounds_won,
        kills: p.kills,
        deaths: p.deaths,
        damage_dealt: p.damage_dealt,
        damage_taken: p.damage_taken,
        self_damage: p.self_damage,
        shots_fired: p.shots_fired,
        items_used: p.items_used,
        elo_change: p.elo_change,
        xp_earned: p.xp_earned,
        elo_rating: p.user?.elo_rating || null,
      }));

      // Mapear rounds
      const rounds = game.rounds.map(r => ({
        round_number: r.round_number,
        winner_id: r.winner_id,
        max_hp: r.max_hp,
        shells_live: r.shells_live,
        shells_blank: r.shells_blank,
        started_at: r.started_at,
        ended_at: r.ended_at,
      }));

      return {
        id: game.id,
        room_code: game.room_code,
        status: game.status,
        created_at: game.created_at,
        ended_at: game.ended_at,
        total_rounds: game.current_round,
        position: userParticipation.position,
        rounds_won: userParticipation.rounds_won,
        kills: userParticipation.kills,
        deaths: userParticipation.deaths,
        damage_dealt: userParticipation.damage_dealt,
        damage_taken: userParticipation.damage_taken,
        self_damage: userParticipation.self_damage,
        shots_fired: userParticipation.shots_fired,
        items_used: userParticipation.items_used,
        elo_change: userParticipation.elo_change,
        xp_earned: userParticipation.xp_earned,
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
          user_id: userId,
          game: {
            status: GameStatus.COMPLETED,
          },
        },
        select: {
          position: true,
          kills: true,
          damage_dealt: true,
          game: {
            select: {
              participants: {
                select: {
                  user_id: true,
                },
              },
            },
          },
        },
        orderBy: {
          game: {
            ended_at: 'desc',
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
        ? recentGames.reduce((a, b) => a + b.damage_dealt, 0) / recentGames.length
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
          user_id: userId,
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
