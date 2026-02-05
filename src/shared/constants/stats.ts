// ==========================================
// STATS DEFINITIONS - Sistema de Progressao
// ==========================================

import {
  StatDefinition,
  StatCategory,
  StatKey,
  StatProgress,
  UserStats,
} from '../types/stats.types';

// ==========================================
// STAT DEFINITIONS
// ==========================================

export const STAT_DEFINITIONS: StatDefinition[] = [
  // ==========================================
  // COMBAT
  // ==========================================
  {
    key: 'kills',
    name: 'Eliminacoes',
    description: 'Total de jogadores eliminados',
    icon: 'skull',
    category: 'combat',
    milestones: [1, 10, 50, 100, 500, 1000, 5000],
    xpPerMilestone: [10, 25, 50, 100, 250, 500, 1000],
  },
  {
    key: 'deaths',
    name: 'Mortes',
    description: 'Vezes que foi eliminado',
    icon: 'grave',
    category: 'combat',
    milestones: [1, 10, 50, 100, 500, 1000],
    xpPerMilestone: [5, 10, 25, 50, 100, 200],
  },
  {
    key: 'damageDealt',
    name: 'Dano Causado',
    description: 'Total de dano causado a oponentes',
    icon: 'explosion',
    category: 'combat',
    milestones: [50, 200, 500, 1000, 5000, 10000],
    xpPerMilestone: [10, 25, 50, 100, 250, 500],
    format: 'damage',
  },
  {
    key: 'liveHits',
    name: 'Tiros Certeiros',
    description: 'Acertos com bala real',
    icon: 'target',
    category: 'combat',
    milestones: [10, 50, 100, 500, 1000, 5000],
    xpPerMilestone: [10, 25, 50, 100, 250, 500],
  },
  {
    key: 'sawedShots',
    name: 'Dano Dobrado',
    description: 'Tiros com serra (dano 2x)',
    icon: 'saw',
    category: 'combat',
    milestones: [5, 20, 50, 100, 500],
    xpPerMilestone: [15, 30, 75, 150, 300],
  },

  // ==========================================
  // MATCHES
  // ==========================================
  {
    key: 'gamesPlayed',
    name: 'Partidas',
    description: 'Total de partidas jogadas',
    icon: 'gamepad',
    category: 'matches',
    milestones: [1, 10, 50, 100, 500, 1000],
    xpPerMilestone: [10, 25, 50, 100, 250, 500],
  },
  {
    key: 'wins',
    name: 'Vitorias',
    description: 'Partidas vencidas',
    icon: 'trophy',
    category: 'matches',
    milestones: [1, 10, 50, 100, 500, 1000],
    xpPerMilestone: [15, 40, 100, 200, 500, 1000],
  },
  {
    key: 'bestWinStreak',
    name: 'Maior Sequencia',
    description: 'Maior sequencia de vitorias',
    icon: 'fire',
    category: 'matches',
    milestones: [3, 5, 10, 15, 20],
    xpPerMilestone: [25, 50, 150, 300, 500],
  },

  // ==========================================
  // ITEMS
  // ==========================================
  {
    key: 'itemsUsed',
    name: 'Itens Usados',
    description: 'Total de itens utilizados',
    icon: 'backpack',
    category: 'items',
    milestones: [10, 50, 100, 500, 1000, 5000],
    xpPerMilestone: [10, 25, 50, 100, 250, 500],
  },
  {
    key: 'adrenalineUses',
    name: 'Adrenalina',
    description: 'Itens roubados com adrenalina',
    icon: 'syringe',
    category: 'items',
    milestones: [5, 20, 50, 100, 500],
    xpPerMilestone: [10, 25, 50, 100, 250],
  },
  {
    key: 'handcuffUses',
    name: 'Algemas',
    description: 'Jogadores algemados',
    icon: 'handcuffs',
    category: 'items',
    milestones: [5, 20, 50, 100, 500],
    xpPerMilestone: [10, 25, 50, 100, 250],
  },
  {
    key: 'infoItemUses',
    name: 'Informacao',
    description: 'Uso de lupa ou celular',
    icon: 'magnifying',
    category: 'items',
    milestones: [10, 30, 100, 500, 1000],
    xpPerMilestone: [10, 25, 50, 100, 250],
  },
  {
    key: 'expiredMedicineSurvived',
    name: 'Sorte com Remedio',
    description: 'Sobreviveu ao remedio vencido',
    icon: 'medicine',
    category: 'items',
    milestones: [1, 5, 10, 50, 100],
    xpPerMilestone: [20, 50, 100, 250, 500],
  },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calcula o progresso de uma estatistica
 */
export function calculateStatProgress(
  definition: StatDefinition,
  value: number
): StatProgress {
  const { key, milestones } = definition;

  // Encontrar milestones completados
  const completedMilestones = milestones.filter((m) => value >= m);

  // Encontrar o indice do milestone atual (proximo a ser completado)
  const currentMilestoneIndex = completedMilestones.length;

  // Proximo milestone (null se todos completados)
  const nextMilestone =
    currentMilestoneIndex < milestones.length
      ? milestones[currentMilestoneIndex]
      : null;

  // Calcular progresso ate o proximo milestone
  let progress = 0;
  if (nextMilestone !== null) {
    const previousMilestone =
      currentMilestoneIndex > 0 ? milestones[currentMilestoneIndex - 1] : 0;
    const range = nextMilestone - previousMilestone;
    const current = value - previousMilestone;
    progress = Math.min(100, (current / range) * 100);
  } else {
    progress = 100; // Todos milestones completados
  }

  return {
    key,
    value,
    currentMilestoneIndex,
    nextMilestone,
    progress,
    completedMilestones,
  };
}

/**
 * Retorna estatisticas por categoria
 */
export function getStatsByCategory(category: StatCategory): StatDefinition[] {
  return STAT_DEFINITIONS.filter((s) => s.category === category);
}

/**
 * Retorna uma definicao de stat por key
 */
export function getStatDefinition(key: StatKey): StatDefinition | undefined {
  return STAT_DEFINITIONS.find((s) => s.key === key);
}

/**
 * Formata valor da estatistica
 */
export function formatStatValue(
  value: number,
  format?: 'number' | 'damage'
): string {
  if (format === 'damage') {
    if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  }

  if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

/**
 * Formata milestone para exibicao
 */
export function formatMilestone(value: number): string {
  if (value >= 10000) return `${value / 1000}K`;
  if (value >= 1000) return `${value / 1000}K`;
  return value.toString();
}

/**
 * Calcula XP total ganho de uma lista de progressos
 */
export function calculateTotalXpEarned(progress: StatProgress[]): number {
  let totalXp = 0;

  for (const stat of progress) {
    const definition = STAT_DEFINITIONS.find((d) => d.key === stat.key);
    if (!definition) continue;

    // Somar XP de cada milestone completado
    for (let i = 0; i < stat.completedMilestones.length; i++) {
      totalXp += definition.xpPerMilestone[i] ?? 0;
    }
  }

  return totalXp;
}

/**
 * Mapeia dados do banco para UserStats
 */
export function mapDatabaseToUserStats(dbUser: {
  total_kills: number;
  total_deaths: number;
  total_damage_dealt: number;
  total_live_hits: number;
  total_sawed_shots: number;
  games_played: number;
  games_won: number;
  best_win_streak: number;
  total_items_used: number;
  total_adrenaline_uses: number;
  total_handcuff_uses: number;
  total_info_item_uses: number;
  expired_medicine_survived: number;
}): UserStats {
  return {
    kills: dbUser.total_kills,
    deaths: dbUser.total_deaths,
    damageDealt: dbUser.total_damage_dealt,
    liveHits: dbUser.total_live_hits,
    sawedShots: dbUser.total_sawed_shots,
    gamesPlayed: dbUser.games_played,
    wins: dbUser.games_won,
    bestWinStreak: dbUser.best_win_streak,
    itemsUsed: dbUser.total_items_used,
    adrenalineUses: dbUser.total_adrenaline_uses,
    handcuffUses: dbUser.total_handcuff_uses,
    infoItemUses: dbUser.total_info_item_uses,
    expiredMedicineSurvived: dbUser.expired_medicine_survived,
  };
}
